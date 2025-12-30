
export enum Category {
  TABLET = 'Tablet',
  CAPSULE = 'Capsule',
  SYRUP = 'Syrup',
  INJECTION = 'Injection',
  CREAM = 'Cream',
  SURGICAL = 'Surgical',
  COSMETIC = 'Cosmetic',
  GENERAL = 'General'
}

export interface StockAdjustment {
  id: string;
  date: string;
  delta: number;
  newTotal: number;
  reason?: string;
  user: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string; // ISO date string
  stock: number;
  purchasePrice: number; // For P&L calculation
  adjustmentHistory?: StockAdjustment[];
}

export interface MedicineVariant {
  id: string;
  name: string; // e.g. "Strip of 10", "Bottle 100ml"
  multiplier: number; // how many base units
  price: number;
  barcode?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  department: 'Pharmacy' | 'Surgical' | 'FMCG';
  category: Category;
  manufacturer: string;
  price: number;
  minThreshold: number;
  batches: Batch[];
  variants?: MedicineVariant[];
  ingredients?: string;
  image?: string;
  barcode?: string; 
  description?: string; 
}

// Patient / Customer Management
export interface Customer {
  id: string;
  name: string;
  phone: string;
  abhaId?: string;
  isChronic: boolean;
  createdAt: string;
}

// Accounting Types
export interface Expense {
  id: string;
  date: string;
  category: 'Rent' | 'Salary' | 'Electricity' | 'Supplies' | 'Other';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank';
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Credit' | 'Debit';
  amount: number;
  account: 'Cash' | 'Bank';
  description: string;
  gstAmount: number;
}

export interface InvoiceItem {
  medicineId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  gstRate: number; // usually 12% or 18%
}

export interface Invoice {
  id: string;
  customerName: string;
  customerPhone: string;
  abhaId?: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  gstTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  refillReminder?: boolean;
  isChronic?: boolean;
  treatmentDuration?: number; // Days of supply
}

export interface ReturnLog {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  reason: string;
  date: string;
  rmaNumber: string;
  manufacturer: string;
}

export interface DashboardStats {
  totalStockValue: number;
  expiringSoonCount: number; 
  expiringWithin30DaysCount: number; 
  outOfStockCount: number;
  todaySales: number;
  monthlyProfit: number;
}
