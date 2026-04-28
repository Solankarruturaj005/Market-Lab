import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class WatchlistService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  async getWatchlist(userId: number) {
    console.log(`[WatchlistService] Loading watchlist for user ${userId}`);

    const items = await this.prisma.watchlist.findMany({
      where: { userId },
      include: { stock: { include: { prices: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      stock: this.stockService.serializeStock(item.stock, 90),
    }));
  }

  async addToWatchlist(userId: number, stockId: number) {
    console.log(`[WatchlistService] Adding stock ${stockId} to watchlist for user ${userId}`);

    const stock = await this.prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    try {
      const item = await this.prisma.watchlist.create({
        data: { userId, stockId },
        include: { stock: { include: { prices: true } } },
      });

      return {
        ...item,
        stock: this.stockService.serializeStock(item.stock, 90),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Stock is already in your watchlist');
      }

      console.error('[WatchlistService] Failed to add stock to watchlist', error);
      throw new InternalServerErrorException('Unable to update your watchlist');
    }
  }

  async removeFromWatchlist(userId: number, id: number) {
    console.log(`[WatchlistService] Removing watchlist item ${id} for user ${userId}`);

    const item = await this.prisma.watchlist.findFirst({
      where: {
        userId,
        OR: [{ id }, { stockId: id }],
      },
      include: { stock: { include: { prices: true } } },
    });
    if (!item) {
      throw new NotFoundException('Watchlist item not found');
    }

    await this.prisma.watchlist.delete({
      where: { id: item.id },
    });

    return {
      id: item.id,
      stockId: item.stockId,
      stock: this.stockService.serializeStock(item.stock, 90),
      removed: true,
    };
  }
}
