import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: 'FriendFinder <noreply@magocorporate.com>',
        to: email,
        subject: 'Your verification code',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #6366f1;">🌍 FriendFinder</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
              ${code}
            </div>
            <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }
}