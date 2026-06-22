"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let SmsService = class SmsService {
    async sendVerificationCode(phoneNumber, code) {
        const message = 'Your FriendFinder verification code is: ' + code;
        try {
            const url = 'https://api.keccel.com/sms/v1/message.asp';
            await axios_1.default.get(url, {
                params: {
                    token: 'K54GTBD3RWUTCUK',
                    from: 'BIAKUUZA',
                    to: phoneNumber,
                    message: message,
                },
            });
            return true;
        }
        catch (error) {
            console.error('SMS send failed:', error);
            return false;
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = __decorate([
    (0, common_1.Injectable)()
], SmsService);
//# sourceMappingURL=sms.service.js.map