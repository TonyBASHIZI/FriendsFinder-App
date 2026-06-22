export declare class EmailService {
    private resend;
    sendVerificationCode(email: string, code: string): Promise<boolean>;
}
