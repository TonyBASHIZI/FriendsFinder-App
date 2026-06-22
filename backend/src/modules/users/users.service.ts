import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserLocation } from '../../entities/user-location.entity';
import { UpdateProfileDto, UpdateLocationDto } from './users.dto';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserLocation)
    private readonly locationRepo: Repository<UserLocation>,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.userRepo.update(userId, dto);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async sendPhoneVerification(userId: string, phoneNumber: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userRepo.update(userId, {
      phoneNumber,
      phoneVerificationCode: code,
      phoneVerificationExpires: expires,
      phoneVerified: false,
    });

    const sent = await this.smsService.sendVerificationCode(phoneNumber, code);
    if (!sent) throw new BadRequestException('Failed to send SMS');

    return { success: true, message: 'Verification code sent' };
  }

  async verifyPhoneCode(userId: string, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    if (!user.phoneVerificationCode || user.phoneVerificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.phoneVerificationExpires && new Date() > user.phoneVerificationExpires) {
      throw new BadRequestException('Verification code expired');
    }

    await this.userRepo.update(userId, {
      phoneVerified: true,
      phoneVerificationCode: undefined,
      phoneVerificationExpires: undefined,
    });

    return { success: true, message: 'Phone verified!' };
  }

  async sendEmailVerification(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.update(userId, {
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    });

    const sent = await this.emailService.sendVerificationCode(user.email, code);
    if (!sent) throw new BadRequestException('Failed to send email');

    return { success: true, message: 'Verification code sent to your email' };
  }

  async verifyEmailCode(userId: string, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      throw new BadRequestException('Verification code expired');
    }

    await this.userRepo.update(userId, {
      emailVerified: true,
      emailVerificationCode: undefined,
      emailVerificationExpires: undefined,
    });

    return { success: true, message: 'Email verified!' };
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const existing = await this.locationRepo.findOne({ where: { userId } });
    const point = `ST_GeomFromText('POINT(${dto.longitude} ${dto.latitude})', 4326)`;

    if (existing) {
      await this.locationRepo.query(
        `UPDATE user_locations SET coords = ${point}, accuracy_meters = ?, is_visible = ? WHERE user_id = ?`,
        [dto.accuracyMeters || null, dto.isVisible ?? true, userId],
      );
    } else {
      await this.locationRepo.query(
        `INSERT INTO user_locations (id, user_id, coords, accuracy_meters, is_visible)
         VALUES (UUID(), ?, ${point}, ?, ?)`,
        [userId, dto.accuracyMeters || null, dto.isVisible ?? true],
      );
    }

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { location: true },
    });
    if (!user) throw new NotFoundException();
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
