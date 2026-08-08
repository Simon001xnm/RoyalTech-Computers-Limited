
import { Timestamp } from "firebase/firestore";

interface Auditable {
    createdBy?: {
        uid: string;
        name: string;
    };
    lastModifiedBy?: {
        uid: string;
        name: string;
    };
    createdAt: string; // ISO string date
    updatedAt?: string; // ISO string date
}

export type DocumentTheme = 'Corporate' | 'Retail' | 'Wholesale' | 'RentalLeasing' | 'Construction';

export interface Company extends Auditable {
  id: string;
  tenantId?: string; 
  name: string;
  businessType: string;
  industry: string;
  description?: string;
  logoUrl?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  altPhone?: string;
  email: string;
  website?: string;
  
  // SaaS Document Standards
  taxPin?: string;
  vatRate?: number; // e.g. 16
  documentTheme: DocumentTheme;
  
  // Settings / Prefixes
  invoicePrefix: string;
  receiptPrefix: string;
  quotePrefix: string;
  deliveryPrefix: string;

  // Admin Context
  adminPosition: string;

  // Billing & SaaS
  plan?: string;
  status?: 'active' | 'suspended';
  currency: string;
  timezone: string;
  paymentMethod: string;
  billingIdentifier?: string; 
  
  // Bank Details
  bankName?: string;
  bankBranch?: string;
  bankAccNo?: string;
  bankAccName?: string;
  bankAccName2?: string;
  bankCode?: string;

  // Theming
  primaryColor?: string; // Hex color
  secondaryColor?: string; // Hex color
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'user' | 'super_admin';
  tenantId?: string;
  tenantIds?: string[]; 
  permissions?: string[]; 
  avatarUrl?: string;
  status?: 'active' | 'suspended' | 'invited';
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Length"
  value: string; // e.g. "100m"
  sku?: string;
  priceAdjustment?: number;
}

export type TaxStatus = 'Taxable' | 'Exempt' | 'ZeroRated';

export interface Product extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  model?: string;
  description?: string;
  unit: string; 
  buyingPrice: number;
  minStock: number;
  currentStock: number;
  reorderQty: number;
  supplier?: string;
  locationBin?: string;
  hasSerialNumber: boolean;
  warrantyPeriod?: string;
  imageUrl?: string;
  taxStatus: TaxStatus;
  createdAt?: string; 
  updatedAt?: string; 
}

export type StockMovementType = 
  | 'PURCHASE' 
  | 'STOCK IN' 
  | 'SALE' 
  | 'STOCK OUT' 
  | 'ADJUSTMENT' 
  | 'DAMAGED' 
  | 'RETURNED' 
  | 'CUSTOMER RETURN' 
  | 'SUPPLIER RETURN'
  | 'STOCK COUNT';

export interface StockMovement extends Auditable {
  id: string;
  tenantId: string;
  productId: string;
  type: StockMovementType;
  quantity: number; 
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string; 
  timestamp: string;
}

export interface Customer extends Omit<Auditable, 'createdAt' | 'updatedAt'>{
  id: string;
  tenantId?: string;
  name: string;
  alias?: string; // Business name or alternate alias
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  registrationDate: string; 
  createdAt?: string; 
  updatedAt?: string; 
}

export interface SaleItem {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    sellingPrice: number;
    buyingPrice: number; // Historical snapshot
    total: number;
    type: 'asset' | 'accessory' | 'custom';
}

export interface Sale extends Auditable {
    id: string;
    tenantId: string;
    date: string;
    customerId: string;
    customerName: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    totalProfit: number;
    amountPaid: number;
    balance: number;
    paymentMethod: 'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Credit' | 'Split';
    payments?: any[];
    status: 'Paid' | 'Partial' | 'Credit';
}

export interface Document extends Auditable {
  id: string;
  tenantId?: string;
  type: DocumentType;
  title: string;
  generatedDate: string; 
  relatedTo?: string; 
  saleId?: string; 
  data: any; 
}

export type DocumentType = 'Receipt' | 'Invoice' | 'Proforma' | 'RepairNote' | 'DeliveryNote' | 'Quotation' | 'LPO' | 'LeaseAgreement' | 'PurchaseOrder' | 'CreditNote' | 'DebitNote' | 'CustomerStatement';

export interface DocumentLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  serialNumber?: string;
  discount?: number;
  vat?: number;
}
