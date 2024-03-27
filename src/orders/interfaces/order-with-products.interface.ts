import { OrderStatus } from '@prisma/client';

export interface OrderWithProducts {
  items: {
    name: any;
    productId: number;
    quantity: number;
    price: number;
  }[];
  id: string;
  grandTotal: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
