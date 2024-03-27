import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { ChangeStatusDto, CreateOrderDto, OrderPaginationDto, PaidOrderDto } from './dto';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // Extract product ids from items and send them to the products service to validate
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products: any[] = await firstValueFrom(this.client.send({ cmd: 'validate' }, productIds));

      // calculate total amount and total items
      const grandTotal = createOrderDto.items.reduce((_, item) => {
        const price = products.find((product) => product.id === item.productId).price;
        return price * item.quantity;
      }, 0);
      const totalItems = createOrderDto.items.reduce((acc, item) => acc + item.quantity, 0);

      // Begin transaction to create order and update product stock
      const order = await this.order.create({
        data: {
          grandTotal,
          totalItems,
          items: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((product) => product.id === item.productId).price,
              })),
            },
          },
        },
        include: {
          items: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        items: order.items.map((item) => ({
          ...item,
          name: products.find((product) => product.id === item.productId).name,
        })),
      };
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({ statusCode: HttpStatus.BAD_REQUEST, message: 'Check logs for more details' });
    }
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
    const order = await this.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            productId: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) throw new RpcException({ statusCode: HttpStatus.NOT_FOUND, message: 'Order not found' });

    const products = await firstValueFrom(
      this.client.send(
        { cmd: 'validate' },
        order.items.map((item) => item.productId),
      ),
    );

    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      })),
    };
  }

  async changeStatus(changeStatusDto: ChangeStatusDto) {
    const { id, status } = changeStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) return order;

    return this.order.update({ where: { id }, data: { status } });
  }

  async createPaymentSession(order: OrderWithProducts) {
    try {
      const paymentSession = await firstValueFrom(
        this.client.send('create.payment.session', {
          orderId: order.id,
          currency: 'usd',
          items: order.items.map(({ name, quantity, price }) => ({ name, quantity, price })),
        }),
      );

      return paymentSession;
    } catch (error) {
      throw new RpcException({ statusCode: HttpStatus.BAD_REQUEST, message: 'Check logs for more details' });
    }
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    this.logger.log('Order paid');

    const order = await this.order.update({
      where: { id: paidOrderDto.orderId },
      data: {
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stipeChargeId: paidOrderDto.stripePaymentId,
        OrderReceipt: {
          create: {
            receiptUrl: paidOrderDto.receiptUrl,
          },
        },
      },
    });
  }
}
