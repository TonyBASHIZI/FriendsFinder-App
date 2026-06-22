"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
let EmailService = class EmailService {
    resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    async sendVerificationCode(email, code) {
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
        }
        catch (error) {
            console.error('Email send failed:', error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)()
], EmailService);
//# sourceMappingURL=email.service.js.map