import { Controller, Get, Param, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockApiService } from './stock-api.service';

@Controller('stocks')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly stockApiService: StockApiService,
  ) {}

  @Get()
  async getAllStocks() {
    console.log('[StockController] GET /stocks');
    return this.stockService.findAll();
  }

  @Get('live/:symbol')
  getLiveStock(@Param('symbol') symbol: string) {
    return this.stockApiService.getStockPrice(symbol);
  }

  @Get(':symbol/history')
  async getStockHistory(
    @Param('symbol') symbol: string,
    @Query('range') range?: string,
    @Query('interval') interval?: string,
  ) {
    console.log(`[StockController] GET /stocks/${symbol}/history?range=${range}&interval=${interval}`);
    return this.stockService.getHistoryBySymbol(symbol, range, interval);
  }

  @Get(':symbol')
  async getStock(@Param('symbol') symbol: string) {
    console.log(`[StockController] GET /stocks/${symbol}`);
    return this.stockService.findBySymbol(symbol);
  }
}