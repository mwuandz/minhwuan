export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  deliveryType: "auto" | "manual";
  stock?: string[];
};

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export type Order = {
  id: string;
  orderCode: number;
  productId: string;
  productName: string;
  amount: number;
  customerName: string;
  customerContact: string;
  customerEmail?: string;
  status: OrderStatus;
  checkoutUrl?: string;
  qrCode?: string;
  paymentContent: string;
  deliveredData?: string;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
};
