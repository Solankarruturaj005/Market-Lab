import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exResponse = isHttpException ? exception.getResponse() : null;
    const rawMessage =
      typeof exResponse === 'string'
        ? exResponse
        : (exResponse as any)?.message ||
          (exception instanceof Error ? exception.message : 'Internal server error');
    const message = rawMessage;

    console.error(
      `[HttpExceptionFilter] ${request.method} ${request.url} -> ${status}`,
      exception,
    );

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
  }
}
