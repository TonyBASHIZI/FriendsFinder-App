import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserLocation } from '../../entities/user-location.entity';
import { UpdateProfileDto, UpdateLocationDto } from './users.dto';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
export declare class UsersService {
    private readonly userRepo;
    private readonly locationRepo;
    private readonly smsService;
    private readonly emailService;
    constructor(userRepo: Repository<User>, locationRepo: Repository<UserLocation>, smsService: SmsService, emailService: EmailService);
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
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
        location: UserLocation;
    }>;
    sendPhoneVerification(userId: string, phoneNumber: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyPhoneCode(userId: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendEmailVerification(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyEmailCode(userId: string, code: string): Promise<{
        success: boolean;
        message: string;
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
        location: UserLocation;
    }>;
}
