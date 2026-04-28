import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';

const stockSummarySelect = {
  id: true,
  symbol: true,
  name: true,
  price: true,
  change: true,
  volume: true,
} as const;

@Injectable()
export class AlertService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(userId: number) {
    return this.prisma.alert.findMany({
      where: { userId },
      include: { stock: { select: stockSummarySelect } },
    });
  }

  async createAlert(userId: number, data: CreateAlertDto) {
    const stock = await this.prisma.stock.findUnique({ where: { id: data.stockId } });
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return this.prisma.alert.create({
      data: {
        userId,
        stockId: data.stockId,
        targetPrice: data.targetPrice,
        triggerType: data.triggerType,
      },
      include: { stock: { select: stockSummarySelect } }
    });
  }

  async deleteAlert(userId: number, id: number) {
    const alert = await this.prisma.alert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.alert.delete({ where: { id: alert.id } });
  }
}
