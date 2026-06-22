import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  // POST /auth/verify-registration — protected, confirms email code
  @Post('verify-registration')
  @UseGuards(JwtAuthGuard)
  verifyRegistration(@Request() req, @Body() body: { code: string }) {
    return this.authService.verifyRegistrationCode(req.user.id, body.code);
  }

  // POST /auth/resend-code — protected, resends email code
  @Post('resend-code')
  @UseGuards(JwtAuthGuard)
  resendCode(@Request() req) {
    return this.authService.resendRegistrationCode(req.user.id);
  }
}
