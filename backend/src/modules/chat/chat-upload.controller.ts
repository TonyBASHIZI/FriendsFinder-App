import {
  Controller, Post, UseGuards, Request,
  UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatUploadController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './src/uploads',
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const isAudio = file.mimetype.startsWith('audio/');
        const prefix = isAudio ? 'voice-' : 'chat-';
        cb(null, prefix + unique + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.match(/image\/(jpg|jpeg|png|gif|webp)/);
      const isAudio = file.mimetype.match(/audio\/(webm|mpeg|mp3|wav|ogg|mp4)/);
      if (!isImage && !isAudio) {
        return cb(new BadRequestException('Only image or audio files allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadChatImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: '/uploads/' + file.filename };
  }
}