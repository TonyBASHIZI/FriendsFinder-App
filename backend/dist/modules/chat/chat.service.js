"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("../../entities/message.entity");
let ChatService = class ChatService {
    convoRepo;
    messageRepo;
    constructor(convoRepo, messageRepo) {
        this.convoRepo = convoRepo;
        this.messageRepo = messageRepo;
    }
    async getOrCreateConversation(userAId, userBId) {
        const [a, b] = [userAId, userBId].sort();
        let convo = await this.convoRepo.findOne({
            where: { userAId: a, userBId: b },
        });
        if (!convo) {
            convo = this.convoRepo.create({ userAId: a, userBId: b });
            await this.convoRepo.save(convo);
        }
        return convo;
    }
    async getConversations(userId) {
        const convos = await this.convoRepo.query(`SELECT
         c.id, c.last_message_at as lastMessageAt,
         u.id as friendId, u.username, u.display_name as displayName, u.avatar_url as avatarUrl,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as lastMessage,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unreadCount
       FROM conversations c
       JOIN users u ON (u.id = CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
       WHERE c.user_a_id = ? OR c.user_b_id = ?
       ORDER BY c.last_message_at DESC`, [userId, userId, userId, userId]);
        return convos;
    }
    async getMessages(conversationId, userId) {
        await this.messageRepo.query(`UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?`, [conversationId, userId]);
        return this.messageRepo.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
            take: 100,
        });
    }
    async saveMessage(conversationId, senderId, content) {
        const message = this.messageRepo.create({ conversationId, senderId, content });
        await this.messageRepo.save(message);
        await this.convoRepo.update(conversationId, { lastMessageAt: new Date() });
        return message;
    }
    async saveCallRecord(conversationId, callerId, type, durationSeconds) {
        const content = type === 'missed'
            ? '__CALL_MISSED__'
            : '__CALL_COMPLETED__' + (durationSeconds || 0);
        const message = this.messageRepo.create({ conversationId, senderId: callerId, content });
        await this.messageRepo.save(message);
        await this.convoRepo.update(conversationId, { lastMessageAt: new Date() });
        return message;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map