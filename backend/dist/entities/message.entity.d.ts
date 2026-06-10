import { User } from './user.entity';
export declare class Conversation {
    id: string;
    userAId: string;
    userBId: string;
    lastMessageAt: Date;
    createdAt: Date;
    userA: User;
    userB: User;
}
export declare class Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    conversation: Conversation;
    sender: User;
}
