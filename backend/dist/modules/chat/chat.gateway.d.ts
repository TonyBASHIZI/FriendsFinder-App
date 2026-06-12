import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly jwtService;
    server: Server;
    private onlineUsers;
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
    isOnline(userId: string): boolean;
}
