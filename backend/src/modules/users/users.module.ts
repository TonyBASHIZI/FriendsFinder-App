import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UploadController } from './upload.controller';
import { UsersService } from './users.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { User } from '../../entities/user.entity';
import { UserLocation } from '../../entities/user-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserLocation]),
    MulterModule.register({ dest: './src/uploads' }),
  ],
  controllers: [UsersController, UploadController],
  providers: [UsersService, SmsService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}