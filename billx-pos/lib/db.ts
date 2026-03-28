import Dexie, { Table } from 'dexie';

export interface Category {
  id: string;
  businessId: string;
  name: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  primaryImageUrl?: string | null;
  // you can extend this to match the full schema
}

export interface OfflineOrder {
  clientOrderId: string; // Used as primary key in Dexie
  businessId: string;
  orderNumber: string;
  orderType: string;
  customerName: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: any[]; // Store order items directly here for easier syncing
  sync_status: 'pending' | 'synced'; // The crucial flag for background sync
}

export class BillXDB extends Dexie {
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  orders!: Table<OfflineOrder, string>;

  constructor() {
    super('BillXDB');
    this.version(1).stores({
      categories: 'id, businessId, displayOrder',
      products: 'id, businessId, categoryId, isAvailable',
      orders: 'clientOrderId, sync_status, createdAt' 
    });
  }
}

export const db = new BillXDB();
