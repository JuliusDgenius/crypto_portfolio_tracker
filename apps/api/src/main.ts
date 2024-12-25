import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // set global prefix from environment variable
  app.setGlobalPrefix(process.env.API_PREFIX);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
