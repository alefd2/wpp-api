import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe());

  const reflector = new Reflector();
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('WhatsApp API')
    .setDescription('API para gerenciamento de WhatsApp')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
