import { Controller, Get, Patch, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateLocationDto } from './users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/phone/send-code')
  sendPhoneCode(@Request() req, @Body() body: { phoneNumber: string }) {
    return this.usersService.sendPhoneVerification(req.user.id, body.phoneNumber);
  }

  @Post('me/phone/verify')
  verifyPhone(@Request() req, @Body() body: { code: string }) {
    return this.usersService.verifyPhoneCode(req.user.id, body.code);
  }

  @Post('me/email/send-code')
  sendEmailCode(@Request() req) {
    return this.usersService.sendEmailVerification(req.user.id);
  }

  @Post('me/email/verify')
  verifyEmail(@Request() req, @Body() body: { code: string }) {
    return this.usersService.verifyEmailCode(req.user.id, body.code);
  }

  @Patch('me/location')
  updateLocation(@Request() req, @Body() dto: UpdateLocationDto) {
    return this.usersService.updateLocation(req.user.id, dto);
  }
}
