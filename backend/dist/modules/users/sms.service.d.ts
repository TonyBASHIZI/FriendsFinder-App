export declare class SmsService {
    sendVerificationCode(phoneNumber: string, code: string): Promise<boolean>;
}
