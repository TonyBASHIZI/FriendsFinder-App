"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../entities/user.entity");
const email_service_1 = require("../users/email.service");
let AuthService = class AuthService {
    userRepo;
    jwtService;
    emailService;
    constructor(userRepo, jwtService, emailService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async register(dto) {
        const existing = await this.userRepo.findOne({
            where: [{ email: dto.email }, { username: dto.username }],
        });
        if (existing) {
            const field = existing.email === dto.email ? 'email' : 'username';
            throw new common_1.ConflictException(`This ${field} is already taken`);
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        const user = this.userRepo.create({
            email: dto.email,
            username: dto.username,
            passwordHash,
            displayName: dto.displayName || dto.username,
            emailVerified: false,
            emailVerificationCode: code,
            emailVerificationExpires: expires,
        });
        await this.userRepo.save(user);
        console.log('REGISTER: sending code', code, 'to', user.email);
        const sent = await this.emailService.sendVerificationCode(user.email, code);
        console.log('REGISTER: send result =', sent);
        return this.buildTokenResponse(user);
    }
    async verifyRegistrationCode(userId, code) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
            throw new common_1.BadRequestException('Verification code expired');
        }
        await this.userRepo.update(userId, {
            emailVerified: true,
            emailVerificationCode: undefined,
            emailVerificationExpires: undefined,
        });
        return { success: true };
    }
    async resendRegistrationCode(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await this.userRepo.update(userId, {
            emailVerificationCode: code,
            emailVerificationExpires: expires,
        });
        await this.emailService.sendVerificationCode(user.email, code);
        return { success: true };
    }
    async login(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email, isActive: true } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid email or password');
        const match = await bcrypt.compare(dto.password, user.passwordHash);
        if (!match)
            throw new common_1.UnauthorizedException('Invalid email or password');
        return this.buildTokenResponse(user);
    }
    buildTokenResponse(user) {
        const payload = { sub: user.id, email: user.email, username: user.username };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                phoneNumber: user.phoneNumber,
            },
        };
    }
    async getMe(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const { passwordHash, ...safe } = user;
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map