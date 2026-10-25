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

export interface CategoryGroup {
    name: string;
    subCategories: string[];
}

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

  // Inventory Groups
  categories?: CategoryGroup[];
  unitsOfMeasure?: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'user';
  tenantId?: string;
  tenantIds?: string[]; 
  permissions?: string[]; 
  avatarUrl?: string;
  status?: 'active' | 'suspended' | 'invited';
  createdAt: string;
}

export type TaxStatus = 'Taxable' | 'Exempt' | 'ZeroRated';

export interface Asset extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  tenantId: string;
  model: string;
  serialNumber: string;
  barcode?: string;
  sku?: string;
  category?: string;
  subCategory?: string;
  status: 'Available' | 'Leased' | 'Repair' | 'Sold' | 'With Reseller';
  quantity: number;
  unit: string;
  purchaseDate: string;
  purchasePrice: number; // Buying price
  sellingPrice: number;
  isSerialized: boolean;
  createdAt?: string; 
  updatedAt?: string; 
}

// Alias for Product to maintain backward compatibility if needed
export type Product = Asset;

export interface Customer extends Omit<Auditable, 'createdAt' | 'updatedAt'>{
  id: string;
  tenantId?: string;
  name: string;
  alias?: string; 
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
    unit: string;
    sellingPrice: number;
    buyingPrice: number;
    total: number;
    type: 'asset' | 'accessory' | 'custom';
}

export interface Sale extends Auditable {
    id: string;
    tenantId: string;
    date: string;
    customerId: string;
    customerName: string;
    invoiceNumber?: string; // Added to track doc title in ledger
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    balance: number;
    paymentMethod: 'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Credit' | 'Split' | 'Till' | 'Paybill' | 'Cheque';
    payments?: any[];
    status: 'Paid' | 'Partial' | 'Credit';
}

export interface Payment extends Auditable {
    id: string;
    tenantId: string;
    customerId: string;
    customerName: string;
    amount: number;
    method: 'Cash' | 'M-Pesa' | 'Bank' | 'Card' | 'Credit' | 'Till' | 'Paybill' | 'Cheque';
    type: 'Payment' | 'Credit Note';
    reference?: string;
    date: string;
    saleId?: string;
    documentId?: string;
    notes?: string;
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

export type DocumentType = 'Receipt' | 'Invoice' | 'Proforma' | 'RepairNote' | 'DeliveryNote' | 'Quotation' | 'LPO' | 'PurchaseOrder' | 'CreditNote' | 'DebitNote' | 'CustomerStatement';

export interface DocumentLineItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  serialNumber?: string;
  discount?: number;
  vat?: number;
}
