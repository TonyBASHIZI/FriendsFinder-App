import { User } from './user.entity';
export declare class UserLocation {
    id: string;
    userId: string;
    coords: string;
    accuracyMeters: number;
    isVisible: boolean;
    updatedAt: Date;
    user: User;
}
