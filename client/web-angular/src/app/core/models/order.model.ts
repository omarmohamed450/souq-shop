export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface OrderLine {
  item: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'opened' | 'in-transit' | 'closed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ManagerOrderNote {
  _id: string;
  text: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  referenceNumber: string;
  customer: OrderCustomer;
  notes: string;
  managerNotes: ManagerOrderNote[];
  items: OrderLine[];
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  approvalStatus: ApprovalStatus;
  stockDeducted: boolean;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  paidAt?: string;
  paymentFailedAt?: string;
  paymentFailureReason: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvalError: string;
  confirmationEmailSentAt?: string;
  confirmationEmailError: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  customer: OrderCustomer;
  notes?: string;
  items: Array<{ itemId: string; quantity: number }>;
}

export interface CreateOrderResult {
  order: Order;
  checkoutUrl: string;
}

export interface PublicOrderStatus {
  _id: string;
  referenceNumber: string;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  approvalStatus: ApprovalStatus;
  stockDeducted: boolean;
  paidAt: string | null;
  createdAt: string;
  customerEmail: string;
}

export interface PastCustomer {
  name: string;
  email: string;
  phone: string;
  orderId: string;
  referenceNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  lastOrderAt: string;
}
