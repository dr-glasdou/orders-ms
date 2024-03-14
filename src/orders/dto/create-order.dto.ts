import { OrderStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { OrderStatusList } from '../enum';

export class CreateOrderDto {
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  grandTotal: number;

  @IsNumber()
  @IsPositive()
  totalItems: number;

  @IsEnum(OrderStatusList, { message: `Status must be one of the following: ${OrderStatusList.join(', ')}` })
  @IsOptional()
  status: OrderStatus = OrderStatus.PENDING;

  @IsBoolean()
  @IsOptional()
  paid: boolean = false;
}
