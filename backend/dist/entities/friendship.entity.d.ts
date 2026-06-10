import { User } from './user.entity';
export declare enum FriendshipStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    BLOCKED = "blocked"
}
export declare class Friendship {
    id: string;
    requesterId: string;
    receiverId: string;
    status: FriendshipStatus;
    createdAt: Date;
    respondedAt: Date;
    requester: User;
    receiver: User;
}
