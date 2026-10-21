"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const dotenv = require("dotenv");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
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
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, _res, next) => {
        logger.debug(`[HTTP] ${req.method} ${req.originalUrl}`);
        next();
    });
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/test', (_req, res) => {
        res.status(200).json({ status: 'ok', message: 'Backend is running', timestamp: new Date().toISOString() });
    });
    const isProduction = process.env.NODE_ENV === 'production';
    const configuredOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
        ];
    app.enableCors({
        origin: isProduction ? configuredOrigins : true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const port = 5000;
    await app.listen(5000);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Health check: GET http://localhost:${port}/test`);
}
void bootstrap();
//# sourceMappingURL=main.js.map