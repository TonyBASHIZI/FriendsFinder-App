import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = 'Your FriendFinder verification code is: ' + code;

    try {
      const url = 'https://api.keccel.com/sms/v1/message.asp';

      await axios.get(url, {
        params: {
          token: 'K54GTBD3RWUTCUK', // put your real token here
          from: 'BIAKUUZA',
          to: phoneNumber,
          message: message,
        },
      });

      return true;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }
}