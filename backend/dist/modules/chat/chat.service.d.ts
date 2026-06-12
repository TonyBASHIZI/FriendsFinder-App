import { Repository } from 'typeorm';
import { Conversation, Message } from '../../entities/message.entity';
export declare class ChatService {
    private readonly convoRepo;
    private readonly messageRepo;
    constructor(convoRepo: Repository<Conversation>, messageRepo: Repository<Message>);
    getOrCreateConversation(userAId: string, userBId: string): Promise<Conversation>;
    getConversations(userId: string): Promise<any>;
    getMessages(conversationId: string, userId: string): Promise<Message[]>;
    saveMessage(conversationId: string, senderId: string, content: string): Promise<Message>;
}
