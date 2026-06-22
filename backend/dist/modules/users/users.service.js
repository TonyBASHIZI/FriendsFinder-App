"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
const user_location_entity_1 = require("../../entities/user-location.entity");
const sms_service_1 = require("./sms.service");
const email_service_1 = require("./email.service");
let UsersService = class UsersService {
    userRepo;
    locationRepo;
    smsService;
    emailService;
    constructor(userRepo, locationRepo, smsService, emailService) {
        this.userRepo = userRepo;
        this.locationRepo = locationRepo;
        this.smsService = smsService;
        this.emailService = emailService;
    }
    async updateProfile(userId, dto) {
        await this.userRepo.update(userId, dto);
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException();
        const { passwordHash, ...safe } = user;
        return safe;
    }
    async sendPhoneVerification(userId, phoneNumber) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await this.userRepo.update(userId, {
            phoneNumber,
            phoneVerificationCode: code,
            phoneVerificationExpires: expires,
            phoneVerified: false,
        });
        const sent = await this.smsService.sendVerificationCode(phoneNumber, code);
        if (!sent)
            throw new common_1.BadRequestException('Failed to send SMS');
        return { success: true, message: 'Verification code sent' };
    }
    async verifyPhoneCode(userId, code) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException();
        if (!user.phoneVerificationCode || user.phoneVerificationCode !== code) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        if (user.phoneVerificationExpires && new Date() > user.phoneVerificationExpires) {
            throw new common_1.BadRequestException('Verification code expired');
        }
        await this.userRepo.update(userId, {
            phoneVerified: true,
            phoneVerificationCode: undefined,
            phoneVerificationExpires: undefined,
        });
        return { success: true, message: 'Phone verified!' };
    }
    async sendEmailVerification(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await this.userRepo.update(userId, {
            emailVerificationCode: code,
            emailVerificationExpires: expires,
        });
        const sent = await this.emailService.sendVerificationCode(user.email, code);
        if (!sent)
            throw new common_1.BadRequestException('Failed to send email');
        return { success: true, message: 'Verification code sent to your email' };
    }
    async verifyEmailCode(userId, code) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException();
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
        return { success: true, message: 'Email verified!' };
    }
    async updateLocation(userId, dto) {
        const existing = await this.locationRepo.findOne({ where: { userId } });
        const point = `ST_GeomFromText('POINT(${dto.longitude} ${dto.latitude})', 4326)`;
        if (existing) {
            await this.locationRepo.query(`UPDATE user_locations SET coords = ${point}, accuracy_meters = ?, is_visible = ? WHERE user_id = ?`, [dto.accuracyMeters || null, dto.isVisible ?? true, userId]);
        }
        else {
            await this.locationRepo.query(`INSERT INTO user_locations (id, user_id, coords, accuracy_meters, is_visible)
         VALUES (UUID(), ?, ${point}, ?, ?)`, [userId, dto.accuracyMeters || null, dto.isVisible ?? true]);
        }
        return { success: true };
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: { location: true },
        });
        if (!user)
            throw new common_1.NotFoundException();
        const { passwordHash, ...safe } = user;
        return safe;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_location_entity_1.UserLocation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        sms_service_1.SmsService,
        email_service_1.EmailService])
], UsersService);
//# sourceMappingURL=users.service.js.map