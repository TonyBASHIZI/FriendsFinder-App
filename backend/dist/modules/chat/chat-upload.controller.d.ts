export declare class ChatUploadController {
    uploadChatImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
