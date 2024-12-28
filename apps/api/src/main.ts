import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from '../../../libs/config/src';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger Documentation Setup
  const document = SwaggerModule.createDocument(app, swaggerConfig); // Create the Swagger document
  SwaggerModule.setup('api/api-docs', app, document); // Setup the Swagger UI at the '/api/api-docs' path


  // set global prefix from environment variable
  app.setGlobalPrefix(process.env.API_PREFIX);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
