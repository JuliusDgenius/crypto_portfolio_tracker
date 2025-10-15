import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from '../../../libs/config/src';
import { ValidationPipe } from '@nestjs/common';
import { RolesGuard } from '../../../libs/common/src/guards/authorization/roles.guard';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   // Enable cors
   app.enableCors({
     origin: [
      'https://cryptocurrency-tracker-frontend.vercel.app', 
      'http://localhost:5173'
    ],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
     exposedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
   });

  // Swagger Documentation Setup
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/api-docs', app, document);

  // Use validator pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Secure HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: false, // disable blocking
    contentSecurityPolicy: false,     // disable strict CSP (for SSE)
  }));
  // Compress responses
  app.use((req, res, next) => {
    if (req.path === '/api/stream/prices') return next();
    return compression()(req, res, next);
  });

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new RolesGuard(reflector));
  // set global prefix from environment variable
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
