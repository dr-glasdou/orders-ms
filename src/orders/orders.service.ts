import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { ChangeStatusDto, CreateOrderDto, OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({ data: createOrderDto });
  }

  async findAll(pagination: OrderPaginationDto) {
    const { page, limit, status } = pagination;

    const total = await this.order.count({ where: { status } });
    const lastPage = Math.ceil(total / limit);

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { status },
      }),
      meta: {
        page,
        limit,
        lastPage,
        total,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({ where: { id } });

    if (!order) throw new RpcException({ statusCode: HttpStatus.NOT_FOUND, message: 'Order not found' });

    return order;
  }

  async changeStatus(changeStatusDto: ChangeStatusDto) {
    const { id, status } = changeStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) return order;

    return this.order.update({ where: { id }, data: { status } });
  }
}
