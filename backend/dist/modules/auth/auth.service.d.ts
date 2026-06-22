import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from './auth.dto';
import { EmailService } from '../users/email.service';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly emailService;
    constructor(userRepo: Repository<User>, jwtService: JwtService, emailService: EmailService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            username: string;
            displayName: string;
            avatarUrl: string;
            emailVerified: boolean;
            phoneVerified: boolean;
            phoneNumber: string;
        };
    }>;
    verifyRegistrationCode(userId: string, code: string): Promise<{
        success: boolean;
    }>;
    resendRegistrationCode(userId: string): Promise<{
        success: boolean;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            username: string;
            displayName: string;
            avatarUrl: string;
            emailVerified: boolean;
            phoneVerified: boolean;
            phoneNumber: string;
        };
    }>;
    private buildTokenResponse;
    getMe(userId: string): Promise<{
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
}
