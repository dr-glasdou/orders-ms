import { OrderStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum';

export class ChangeStatusDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatusList, { message: `status must be a valid enum value: ${Object.values(OrderStatusList)}` })
  status: OrderStatus;
}
