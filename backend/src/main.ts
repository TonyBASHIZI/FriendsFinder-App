import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: /^http:\/\/localhost:\d+$/,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log('🚀 API running on http://localhost:3000/api');
}
bootstrap();
