import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.use(require('express').json({ limit: '20mb' }));
  app.use(require('express').urlencoded({ limit: '20mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: /^http:\/\/localhost:\d+$/,
    credentials: true,
  });

  // Serve uploaded avatars as static files
  app.useStaticAssets(join(__dirname, '..', 'src', 'uploads'), {
    prefix: '/uploads',
  });

  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log('🚀 API running on http://localhost:3000/api');
}
bootstrap();
