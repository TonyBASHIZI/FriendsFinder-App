import { FriendsService } from './friends.service';
export declare class FriendsController {
    private readonly friendsService;
    constructor(friendsService: FriendsService);
    sendRequest(req: any, body: {
        receiverId: string;
    }): Promise<{
        success: boolean;
    }>;
    accept(req: any, id: string): Promise<{
        success: boolean;
    }>;
    decline(req: any, id: string): Promise<{
        success: boolean;
    }>;
    getPending(req: any): Promise<{
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
    getFriends(req: any): Promise<{
        friendshipId: string;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
    }[]>;
}
