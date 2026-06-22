import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtPayload } from './jwt.strategy';
import { EmailService } from '../users/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      const field = existing.email === dto.email ? 'email' : 'username';
      throw new ConflictException(`This ${field} is already taken`);
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

    // Return a temporary token so the frontend can call the verify endpoint,
    // but mark account as unverified
    return this.buildTokenResponse(user);
  }

  async verifyRegistrationCode(userId: string, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

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

    return { success: true };
  }

  async resendRegistrationCode(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.update(userId, {
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    });

    await this.emailService.sendVerificationCode(user.email, code);
    return { success: true };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email, isActive: true } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid email or password');

    return this.buildTokenResponse(user);
  }

  private buildTokenResponse(user: User) {
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

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
