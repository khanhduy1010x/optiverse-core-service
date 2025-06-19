import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppExceptionFilter } from './common/exceptions/app-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { AppException } from './common/exceptions/app.exception';
import { ErrorCode } from './common/exceptions/error-code.enum';
import { ApiResponse as ApiResponseWrapper } from 'src/common/api-response';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints
            ? error.constraints[Object.keys(error.constraints)[0]]
            : 'Validation error',
        }));
        throw new AppException(ErrorCode[result[0].message as keyof typeof ErrorCode] ?? null);
      },
      stopAtFirstError: true,
    }),
  );
  app.enableCors({
    origin: '*',
    exposedHeaders: ['X-User-Info'],
  });

  const config = new DocumentBuilder()
    .setTitle('Opt-Verse Server API')
    .setDescription('Welcom to OTP-VERSE')
    .setVersion('1.0')
    .addTag('otp-vers')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token like: <token>',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      extraModels: [ApiResponseWrapper],
    });
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req) => {
        const authHeader = req.headers['Authorization'] || req.headers['authorization'];
        if (authHeader && !authHeader.startsWith('Bearer ')) {
          req.headers['Authorization'] = `Bearer ${authHeader}`;
        }
        return req;
      },
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
