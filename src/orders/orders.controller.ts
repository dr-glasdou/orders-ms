import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto, OrderPaginationDto, PaidOrderDto } from './dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('create')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);

    const paymentSession = await this.ordersService.createPaymentSession(order);

    return { order, paymentSession };
  }

  @MessagePattern('findAll')
  findAll(@Payload() pagination: OrderPaginationDto) {
    return this.ordersService.findAll(pagination);
  }

  @MessagePattern('findOne')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeStatus')
  update(@Payload() changeStatusDto: ChangeStatusDto) {
    return this.ordersService.changeStatus(changeStatusDto);
  }

  @EventPattern('payment.succeeded')
  async paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
    return this.ordersService.paidOrder(paidOrderDto);
  }
}
