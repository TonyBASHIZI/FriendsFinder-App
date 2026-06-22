import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getMe(req: any): Promise<{
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
    verifyRegistration(req: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
    }>;
    resendCode(req: any): Promise<{
        success: boolean;
    }>;
}
