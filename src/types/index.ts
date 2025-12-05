export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "cashier";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  category_id: number;
  price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface Transaction {
  id: number;
  transaction_code: string;
  user_id: number;
  customer_id?: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: "completed" | "cancelled" | "refunded";
  created_at: Date;
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
}

export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  phone?: string;
  email?: string;
  loyalty_points: number;
  created_at: Date;
  updated_at: Date;
}
