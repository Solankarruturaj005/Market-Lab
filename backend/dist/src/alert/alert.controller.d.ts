import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
export declare class AlertController {
    private readonly alertService;
    constructor(alertService: AlertService);
    getAlerts(req: any): Promise<({
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
    createAlert(req: any, body: CreateAlertDto): Promise<{
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
    deleteAlert(req: any, id: number): Promise<{
        id: number;
        createdAt: Date;
        stockId: number;
        userId: number;
        targetPrice: number;
        triggerType: string;
        isActive: boolean;
    }>;
}
