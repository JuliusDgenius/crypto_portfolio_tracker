import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('GrowCoinTracker API')
  .setDescription('API for the GrowCoinTracker Application')
  .setVersion('0.0.1')
  .addServer('/api')
  .addTag('All application', 'application endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build(); 