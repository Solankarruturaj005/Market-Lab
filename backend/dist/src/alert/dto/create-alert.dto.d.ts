export declare enum AlertTriggerType {
    ABOVE = "ABOVE",
    BELOW = "BELOW"
}
export declare class CreateAlertDto {
    stockId: number;
    targetPrice: number;
    triggerType: AlertTriggerType;
}
