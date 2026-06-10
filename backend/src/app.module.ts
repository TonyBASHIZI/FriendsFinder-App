import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { User } from './entities/user.entity';
import { UserLocation } from './entities/user-location.entity';
import { Friendship } from './entities/friendship.entity';
import { Conversation, Message } from './entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'friendfinder',
      entities: [User, UserLocation, Friendship, Conversation, Message],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    DiscoveryModule,
  ],
})
export class AppModule {}
