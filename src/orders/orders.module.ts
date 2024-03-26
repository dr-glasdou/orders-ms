import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transport/nats.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [NatsModule],
})
export class OrdersModule {}
