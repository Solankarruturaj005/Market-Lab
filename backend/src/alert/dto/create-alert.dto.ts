import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Min } from 'class-validator';

export enum AlertTriggerType {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
}

export class CreateAlertDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stockId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetPrice!: number;

  @IsEnum(AlertTriggerType)
  triggerType!: AlertTriggerType;
}
