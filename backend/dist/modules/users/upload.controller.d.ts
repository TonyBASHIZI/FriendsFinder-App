import { UsersService } from './users.service';
export declare class UploadController {
    private readonly usersService;
    constructor(usersService: UsersService);
    uploadAvatar(req: any, file: Express.Multer.File): Promise<void>;
}
