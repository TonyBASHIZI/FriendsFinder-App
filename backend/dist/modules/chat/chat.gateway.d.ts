import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly jwtService;
    server: Server;
    private onlineUsers;
    private activeCalls;
    constructor(chatService: ChatService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    joinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    handleMessage(client: Socket, data: {
        conversationId: string;
        content: string;
    }): Promise<void>;
    startConversation(client: Socket, data: {
        friendId: string;
    }): Promise<void>;
    handleTyping(client: Socket, data: {
        conversationId: string;
    }): void;
    handleCallUser(client: Socket, data: {
        targetUserId: string;
        offer: any;
        callerName: string;
        callerAvatar: string | null;
    }): Promise<void>;
    private logMissedCall;
    handleAnswerCall(client: Socket, data: {
        callerId: string;
        answer: any;
    }): void;
    handleIceCandidate(client: Socket, data: {
        targetUserId: string;
        candidate: any;
    }): void;
    handleEndCall(client: Socket, data: {
        targetUserId: string;
        durationSeconds?: number;
    }): Promise<void>;
    handleDeclineCall(client: Socket, data: {
        callerId: string;
    }): Promise<void>;
}
