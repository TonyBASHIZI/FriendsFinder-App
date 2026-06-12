import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from '../../entities/friendship.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async sendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) throw new BadRequestException('Cannot add yourself');

    const existing = await this.friendshipRepo.findOne({
      where: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId },
      ],
    });
    if (existing) throw new BadRequestException('Request already exists');

    const friendship = this.friendshipRepo.create({ requesterId, receiverId });
    await this.friendshipRepo.save(friendship);
    return { success: true };
  }

  async respond(userId: string, friendshipId: string, accept: boolean) {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId, receiverId: userId, status: FriendshipStatus.PENDING },
    });
    if (!friendship) throw new NotFoundException('Request not found');

    friendship.status = accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED;
    friendship.respondedAt = new Date();
    await this.friendshipRepo.save(friendship);
    return { success: true };
  }

  async getPending(userId: string) {
    const requests = await this.friendshipRepo.find({
      where: { receiverId: userId, status: FriendshipStatus.PENDING },
      relations: { requester: true },
      order: { createdAt: 'DESC' },
    });
    return requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      requester: {
        id: r.requester.id,
        username: r.requester.username,
        displayName: r.requester.displayName,
        avatarUrl: r.requester.avatarUrl,
        bio: r.requester.bio,
      },
    }));
  }

  async getFriends(userId: string) {
    const friendships = await this.friendshipRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { receiverId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: { requester: true, receiver: true },
      order: { respondedAt: 'DESC' },
    });

    return friendships.map((f) => {
      const friend = f.requesterId === userId ? f.receiver : f.requester;
      return {
        friendshipId: f.id,
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
        bio: friend.bio,
      };
    });
  }
}
