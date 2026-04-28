import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HistoryPoint {
  date: string;
  close: number;
}

export interface StockResponse {
  id: number;
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  volume: number;
  isFallback: boolean;
  source: 'database';
  history: HistoryPoint[];
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<StockResponse[]> {
    console.log('[StockService] findAll()');
    const stocks = await this.prisma.stock.findMany({
      include: {
        prices: true,
      },
      orderBy: [{ volume: 'desc' }, { symbol: 'asc' }],
    });

    console.log(`[StockService] Found ${stocks.length} stocks`);
    return stocks.map((stock) => this.serializeStock(stock, 90));
  }

  async findBySymbol(symbol: string): Promise<StockResponse> {
    const upperSymbol = symbol.trim().toUpperCase();
    console.log(`[StockService] findBySymbol(${upperSymbol})`);

    const stock = await this.prisma.stock.findUnique({
      where: { symbol: upperSymbol },
      include: {
        prices: true,
      },
    });

    if (!stock) {
      console.warn(`[StockService] Stock ${upperSymbol} not found`);
      throw new NotFoundException(`Stock with symbol ${symbol} not found`);
    }

    console.log(`[StockService] Found stock ${upperSymbol} with ${stock.prices.length} price records`);
    return this.serializeStock(stock, 365);
  }

  serializeStock(stock: any, historyLimit: number): StockResponse {
    const historyByDate = new Map<string, HistoryPoint>();

    for (const point of (stock.prices ?? []).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )) {
      const close = Number(Number(point.close).toFixed(2));

      if (!Number.isFinite(close) || close <= 0) {
        continue;
      }

      const date = new Date(point.date).toISOString();
      historyByDate.set(date, { date, close });
    }

    const history = Array.from(historyByDate.values())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-historyLimit);

    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      price: this.toPositiveNumberOrNull(stock.price),
      change: this.toNumberOrNull(stock.change),
      volume: Number(stock.volume) || 0,
      isFallback: true,
      source: 'database',
      history,
    };
  }

  private toNumberOrNull(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toPositiveNumberOrNull(value: unknown): number | null {
    const parsed = this.toNumberOrNull(value);
    return parsed != null && parsed > 0 ? parsed : null;
  }
}
