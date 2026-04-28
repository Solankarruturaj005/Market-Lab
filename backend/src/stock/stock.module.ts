import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockApiService } from './stock-api.service';
@Module({
  providers: [StockService, StockApiService],
  controllers: [StockController],
  exports: [StockService, StockApiService],
})
export class StockModule {}
