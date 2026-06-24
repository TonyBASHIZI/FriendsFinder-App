import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: /^http:\/\/localhost:\d+$/, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); // userId -> socketId
  private activeCalls = new Map<string, { callerId: string; targetId: string; startTime: number; answered: boolean }>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      this.onlineUsers.set(payload.sub, client.id);

      // Tell everyone this user is online
      this.server.emit('user_online', { userId: payload.sub });

      // Send the new user the full list of who's currently online
      const onlineList = Array.from(this.onlineUsers.keys());
      client.emit('online_users', onlineList);

    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(data.conversationId);
    const messages = await this.chatService.getMessages(data.conversationId, client.data.userId);
    client.emit('messages_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const message = await this.chatService.saveMessage(data.conversationId, client.data.userId, data.content);
    this.server.to(data.conversationId).emit('new_message', message);
  }

  @SubscribeMessage('start_conversation')
  async startConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { friendId: string },
  ) {
    const convo = await this.chatService.getOrCreateConversation(client.data.userId, data.friendId);
    client.emit('conversation_started', convo);
  }

 @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(data.conversationId).emit('friend_typing', {
      userId: client.data.userId,
      conversationId: data.conversationId,
    });
  }

  // ── Voice call signaling ────────────────────────────────────────────────

  @SubscribeMessage('call_user')
  async handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; offer: any; callerName: string; callerAvatar: string | null },
  ) {
    const callerId = client.data.userId;
    const targetSocketId = this.onlineUsers.get(data.targetUserId);

    const callKey = callerId + '-' + data.targetUserId;
    this.activeCalls.set(callKey, {
      callerId,
      targetId: data.targetUserId,
      startTime: Date.now(),
      answered: false,
    });

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('incoming_call', {
        callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        offer: data.offer,
      });
    }

    // Auto-mark as missed after 30 seconds if not answered
    setTimeout(async () => {
      const call = this.activeCalls.get(callKey);
      if (call && !call.answered) {
        this.activeCalls.delete(callKey);
        const callerSocket = this.onlineUsers.get(callerId);
        const targetSocket = this.onlineUsers.get(data.targetUserId);
        if (callerSocket) this.server.to(callerSocket).emit('call_timeout');
        if (targetSocket) this.server.to(targetSocket).emit('call_timeout');
        await this.logMissedCall(callerId, data.targetUserId);
      }
    }, 30000);
  }

  private async logMissedCall(callerId: string, targetId: string) {
    const convo = await this.chatService.getOrCreateConversation(callerId, targetId);
    const message = await this.chatService.saveCallRecord(convo.id, callerId, 'missed');
    const callerSocket = this.onlineUsers.get(callerId);
    const targetSocket = this.onlineUsers.get(targetId);
    if (callerSocket) this.server.to(callerSocket).emit('new_message', message);
    if (targetSocket) this.server.to(targetSocket).emit('new_message', message);
  }

  @SubscribeMessage('answer_call')
  handleAnswerCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; answer: any },
  ) {
    const calleeId = client.data.userId;
    const callKey = data.callerId + '-' + calleeId;
    const call = this.activeCalls.get(callKey);
    if (call) call.answered = true;

    const callerSocketId = this.onlineUsers.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call_answered', { answer: data.answer });
    }
  }

  @SubscribeMessage('ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; candidate: any },
  ) {
    const targetSocketId = this.onlineUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('ice_candidate', { candidate: data.candidate });
    }
  }

@SubscribeMessage('end_call')
  async handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; durationSeconds?: number },
  ) {
    const userId = client.data.userId;
    const targetSocketId = this.onlineUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call_ended');
    }

    // Clear any pending active call entries between these two users
    this.activeCalls.delete(userId + '-' + data.targetUserId);
    this.activeCalls.delete(data.targetUserId + '-' + userId);

    if (data.durationSeconds && data.durationSeconds > 0) {
      const convo = await this.chatService.getOrCreateConversation(userId, data.targetUserId);
      const message = await this.chatService.saveCallRecord(convo.id, userId, 'completed', data.durationSeconds);
      if (targetSocketId) this.server.to(targetSocketId).emit('new_message', message);
      client.emit('new_message', message);
    }
  }

  @SubscribeMessage('decline_call')
  async handleDeclineCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string },
  ) {
    console.log('decline_call received from', client.data.userId, 'for caller', data.callerId);
    const calleeId = client.data.userId;
    const callerSocketId = this.onlineUsers.get(data.callerId);
    console.log('Caller socket found:', callerSocketId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call_declined');
      console.log('Emitted call_declined to caller');
    } else {
      console.log('CALLER SOCKET NOT FOUND!');
    }

    this.activeCalls.delete(data.callerId + '-' + calleeId);
    try {
      await this.logMissedCall(data.callerId, calleeId);
      console.log('Missed call logged successfully');
    } catch (err) {
      console.error('ERROR logging missed call:', err);
    }
  } 

}
