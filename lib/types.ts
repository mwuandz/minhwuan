export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  deliveryType: "auto" | "manual";
  stock?: string[];
  active?: boolean;
  image?: string;
  badge?: string;
};

export type SiteSettings = {
  siteTitle: string;
  siteSubtitle: string;
  brandDomain: string;
  heroTitle: string;
  heroDescription: string;
  warningText: string;
  eventText: string;
  zaloLink: string;
  communityLink: string;
  themeMode: "light" | "dark";
  accentColor: string;
};

export type CartItem = {
  productId: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type Voucher = {
  id: string;
  code: string;
  description?: string;
  type: "fixed" | "percent";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  expiresAt?: string;
  active?: boolean;
  createdAt?: string;
};

export type VoucherValidation = {
  valid: boolean;
  voucher?: Voucher;
  discountAmount: number;
  message: string;
};

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export type Order = {
  id: string;
  orderCode: number;
  productId?: string;
  productName: string;
  items: CartItem[];
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  voucherCode?: string;
  customerName: string;
  customerContact: string;
  customerEmail?: string;
  customerNote?: string;
  status: OrderStatus;
  checkoutUrl?: string;
  qrCode?: string;
  paymentContent: string;
  deliveredData?: string;
  createdAt: string;
  expiresAt?: string;
  paidAt?: string;
  deliveredAt?: string;
};
