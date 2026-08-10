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

export type TaxStatus = 'Taxable' | 'Exempt' | 'ZeroRated';

export interface Asset extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  tenantId: string;
  model: string;
  serialNumber: string;
  category?: string;
  status: 'Available' | 'Leased' | 'Repair' | 'Sold' | 'With Reseller';
  quantity: number;
  purchaseDate: string;
  sellingPrice: number;
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
    sellingPrice: number;
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
