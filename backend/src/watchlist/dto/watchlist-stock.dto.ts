import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class WatchlistStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stockId!: number;
}
