import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
export declare class DiscoveryService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findNearby(userId: string, radiusKm?: number): Promise<{
        users: never[];
        message: string;
        myLocation?: undefined;
    } | {
        users: any;
        myLocation: {
            lat: any;
            lng: any;
        };
        message?: undefined;
    }>;
}
