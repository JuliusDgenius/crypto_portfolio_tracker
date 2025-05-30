import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from '../../../libs/config/src';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   // Enable cors
   app.enableCors({
     origin: 'http://localhost:5173',
     credentials: true,
     allowedHeaders: ['Content-Type', 'Authorization'],
   });

  // Swagger Documentation Setup
  const document = SwaggerModule.createDocument(app, swaggerConfig); // Create the Swagger document
  SwaggerModule.setup('api/api-docs', app, document); // Setup the Swagger UI at the '/api/api-docs' path

  // Use validator pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  // set global prefix from environment variable
  app.setGlobalPrefix(process.env.API_PREFIX);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
