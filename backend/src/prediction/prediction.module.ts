import { Module } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionController } from './prediction.controller';
import { IndicatorModule } from '../indicator/indicator.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [IndicatorModule, StockModule],
  providers: [PredictionService],
  controllers: [PredictionController],
})
export class PredictionModule {}
