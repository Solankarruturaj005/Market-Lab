import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
export declare class AlertService {
    private prisma;
    constructor(prisma: PrismaService);
    getAlerts(userId: number): Promise<({
        stock: {
            symbol: string;
            id: number;
            name: string;
            price: number;
            change: number;
            volume: number;
        };
    } & {
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
        targetPrice: number;
        triggerType: string;
        isActive: boolean;
    })[]>;
    createAlert(userId: number, data: CreateAlertDto): Promise<{
        stock: {
            symbol: string;
            id: number;
            name: string;
            price: number;
            change: number;
            volume: number;
        };
    } & {
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
        targetPrice: number;
        triggerType: string;
        isActive: boolean;
    }>;
    deleteAlert(userId: number, id: number): Promise<{
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
        targetPrice: number;
        triggerType: string;
        isActive: boolean;
    }>;
}
