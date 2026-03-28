// Core POS Types

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  image?: string;
  primaryImageUrl?: string | null;
  category?: string;
  badge?: string;
  variants?: Variant[];
  modifiers?: Modifier[];
  available?: boolean;
  isAvailable?: boolean;
}

export interface Variant {
  id: string;
  label: string; // "S", "M", "L"
  priceAdjustment: number;
}

export interface Modifier {
  id: string;
  label: string;
  icon: string;
  priceAdjustment: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export type OrderType = "dine-in" | "takeaway" | "delivery";
export type PaymentMethod = "upi" | "cash" | "card";
export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  selectedVariant?: Variant;
  selectedModifiers: Modifier[];
  subtotal: number;
  notes?: string;
}

export interface Customer {
  name: string;
  phone: string;
}

export interface Bill {
  id: string; // "Bill 1", "Bill 2", etc.
  label: string;
  orderNumber: string;
  orderType: OrderType;
  customer: Customer;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discount: number;
  taxRate: number; // 0.05 = 5%
  status: OrderStatus;
  createdAt: Date;
}

export interface PricingBreakdown {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

// Analytics
export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: { name: string; count: number }[];
}

// API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Order for API
export interface CreateOrderPayload {
  billId: string;
  orderType: OrderType;
  customer: Customer;
  items: {
    productId: string;
    quantity: number;
    variantId?: string;
    modifierIds: string[];
    unitPrice: number;
    subtotal: number;
  }[];
  paymentMethod: PaymentMethod;
  discount: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}
