import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { StockModule } from './stock/stock.module';
import { PredictionModule } from './prediction/prediction.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { AlertModule } from './alert/alert.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['backend/.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    StockModule,
    PredictionModule,
    WatchlistModule,
    AlertModule,
    AiModule,
  ],
})
export class AppModule {}
