import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
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

  // Map userId -> socketId
  private onlineUsers = new Map<string, string>();

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
      this.server.emit('user_online', { userId: payload.sub });
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
  async joinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(data.conversationId);
    const messages = await this.chatService.getMessages(data.conversationId, client.data.userId);
    client.emit('messages_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; content: string }) {
    const message = await this.chatService.saveMessage(data.conversationId, client.data.userId, data.content);
    this.server.to(data.conversationId).emit('new_message', message);
  }

  @SubscribeMessage('start_conversation')
  async startConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { friendId: string }) {
    const convo = await this.chatService.getOrCreateConversation(client.data.userId, data.friendId);
    client.emit('conversation_started', convo);
  }

  isOnline(userId: string) {
    return this.onlineUsers.has(userId);
  }
}
