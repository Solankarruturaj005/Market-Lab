import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IndicatorService } from '../indicator/indicator.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class PredictionService {
  constructor(
    private prisma: PrismaService,
    private indicatorService: IndicatorService,
    private stockService: StockService,
  ) {}

  async getPredictionForSymbol(symbol: string) {
    const stock = await this.stockService.findBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException(`Stock not found`);
    }

    try {
      // Attempt to compute technical indicators from price history
      const analysis = this.indicatorService.analyzeStock(stock.history as any);
      console.log(`[PredictionService] Analysis for ${symbol}:`, analysis.signal);

      return {
        symbol: stock.symbol,
        prediction: analysis.signal,
        confidence: analysis.confidence,
        indicators: analysis.indicators,
      };
    } catch (err) {
      // If indicator computation fails (e.g., insufficient history), return a safe default
      console.warn(`[PredictionService] Indicator computation failed for ${symbol}:`, err?.message);
      return {
        symbol: stock.symbol,
        prediction: 'HOLD',
        confidence: 0,
        indicators: {
          sma20: null,
          ema20: null,
          rsi14: null,
          macdHistogram: null,
        },
      };
    }
  }
}
