import { Repository } from 'typeorm';
import { Friendship } from '../../entities/friendship.entity';
import { User } from '../../entities/user.entity';
export declare class FriendsService {
    private readonly friendshipRepo;
    private readonly userRepo;
    constructor(friendshipRepo: Repository<Friendship>, userRepo: Repository<User>);
    sendRequest(requesterId: string, receiverId: string): Promise<{
        success: boolean;
    }>;
    respond(userId: string, friendshipId: string, accept: boolean): Promise<{
        success: boolean;
    }>;
    getPending(userId: string): Promise<{
        id: string;
        createdAt: Date;
        requester: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
            bio: string;
        };
    }[]>;
    getFriends(userId: string): Promise<{
        friendshipId: string;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
    }[]>;
}
