import { IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

export class PaidOrderDto {
  @IsNotEmpty()
  stripePaymentId: string;

  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUrl()
  receiptUrl: string;
}
