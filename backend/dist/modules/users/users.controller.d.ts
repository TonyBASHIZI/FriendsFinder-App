import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateLocationDto } from './users.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
        phoneNumber: string;
        phoneVerified: boolean;
        phoneVerificationCode: string;
        phoneVerificationExpires: Date;
        emailVerified: boolean;
        emailVerificationCode: string;
        emailVerificationExpires: Date;
        birthdate: string;
        gender: import("../../entities/user.entity").Gender;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        location: import("../../entities/user-location.entity").UserLocation;
    }>;
    updateProfile(req: any, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
        phoneNumber: string;
        phoneVerified: boolean;
        phoneVerificationCode: string;
        phoneVerificationExpires: Date;
        emailVerified: boolean;
        emailVerificationCode: string;
        emailVerificationExpires: Date;
        birthdate: string;
        gender: import("../../entities/user.entity").Gender;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        location: import("../../entities/user-location.entity").UserLocation;
    }>;
    sendPhoneCode(req: any, body: {
        phoneNumber: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyPhone(req: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    sendEmailCode(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyEmail(req: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    updateLocation(req: any, dto: UpdateLocationDto): Promise<{
        success: boolean;
    }>;
}
