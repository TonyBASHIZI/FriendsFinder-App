import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserLocation } from '../../entities/user-location.entity';
import { UpdateProfileDto, UpdateLocationDto } from './users.dto';
export declare class UsersService {
    private readonly userRepo;
    private readonly locationRepo;
    constructor(userRepo: Repository<User>, locationRepo: Repository<UserLocation>);
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
        birthdate: string;
        gender: import("../../entities/user.entity").Gender;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        location: UserLocation;
    }>;
    updateLocation(userId: string, dto: UpdateLocationDto): Promise<{
        success: boolean;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
        birthdate: string;
        gender: import("../../entities/user.entity").Gender;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        location: UserLocation;
    }>;
}
