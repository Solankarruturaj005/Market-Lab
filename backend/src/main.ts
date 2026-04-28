import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

dotenv.config();
dotenv.config({ path: 'backend/.env' });

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.log('SERVER STILL RUNNING');
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.log('SERVER STILL RUNNING');
});

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Request logger — helps trace issues during debugging
  app.use((req, _res, next) => {
    logger.debug(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });

  // TASK 2 FIX: Add a simple health-check route accessible without authentication
  // Frontend and testers can hit GET /test to verify the backend is reachable
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/test', (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running', timestamp: new Date().toISOString() });
  });

  // CORS: reflect request origin — safe for development, restrict in production
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = 5000;
  await app.listen(5000);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Health check: GET http://localhost:${port}/test`);
}
void bootstrap();
