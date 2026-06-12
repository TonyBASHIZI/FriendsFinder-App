import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getConversations(req: any): Promise<any>;
    getMessages(id: string, req: any): Promise<import("../../entities/message.entity").Message[]>;
}
