import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message } from '../../entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convoRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async getOrCreateConversation(userAId: string, userBId: string) {
    // Always store smaller UUID as userA for consistency
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

  async getConversations(userId: string) {
    const convos = await this.convoRepo.query(
      `SELECT
         c.id, c.last_message_at as lastMessageAt,
         u.id as friendId, u.username, u.display_name as displayName, u.avatar_url as avatarUrl,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as lastMessage,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unreadCount
       FROM conversations c
       JOIN users u ON (u.id = CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END)
       WHERE c.user_a_id = ? OR c.user_b_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId],
    );
    return convos;
  }

  async getMessages(conversationId: string, userId: string) {
    // Mark messages as read
    await this.messageRepo.query(
      `UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId],
    );

    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async saveMessage(conversationId: string, senderId: string, content: string) {
    const message = this.messageRepo.create({ conversationId, senderId, content });
    await this.messageRepo.save(message);

    // Update conversation lastMessageAt
    await this.convoRepo.update(conversationId, { lastMessageAt: new Date() });

    return message;
  }
}
