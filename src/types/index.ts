
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

export interface Asset extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  tenantId?: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; 
  status: 'Available' | 'Leased' | 'Repair' | 'Sold' | 'With Reseller';
  quantity: number; 
  location?: { lat: number; lng: number }; 
  specifications?: {
    ram: string;
    storage: string;
    processor: string;
    touchscreen?: boolean;
  };
  purchasePrice?: number;
  leasePrice?: number;
  createdAt?: string; 
  updatedAt?: string; 
}

export interface Accessory extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  tenantId?: string;
  name: string;
  serialNumber: string;
  purchaseDate: string; 
  status: 'Available' | 'Sold' | 'With Reseller';
  quantity: number;
  purchasePrice?: number;
  sellingPrice: number;
  createdAt?: string; 
  updatedAt?: string; 
}

export interface Customer extends Omit<Auditable, 'createdAt' | 'updatedAt'>{
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  registrationDate: string; 
  createdAt?: string; 
  updatedAt?: string; 
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

export interface SaleItem {
    id: string;
    name: string;
    description?: string;
    serialNumber: string;
    price: number; 
    quantity: number;
    discount?: number;
    type: 'asset' | 'accessory' | 'custom';
    cogs?: number;
}

export interface Sale extends Auditable {
  id: string;
  tenantId?: string;
  date: string; 
  amount: number; 
  paymentMethod: 'Till' | 'M-Pesa' | 'Bank' | 'Paybill' | 'Cash';
  cogs?: number;
  notes?: string;
  referenceCode?: string;
  items: SaleItem[];
  customerName?: string;
  customerId?: string;
  customerPhone?: string;
  resellerId?: string;
  resellerName?: string;
  status: 'Paid' | 'Pending' | 'Void' | 'Failed';
  paymentError?: string;
  mpesaReceipt?: string;
  vat?: number;
  subtotal?: number;
  totalDiscount?: number;
  amountPaid?: number;
  changeDue?: number;
}

export interface Expense extends Auditable {
  id: string;
  tenantId?: string;
  date: string; 
  category: string;
  amount: number;
  notes?: string;
}

export interface Campaign extends Auditable {
  id: string;
  tenantId?: string;
  name: string;
  subject: string;
  body: string;
  status: 'Draft' | 'Sent' | 'Archived';
  audience: {
    type: 'all' | 'segment';
    customerIds?: string[];
  };
  sentAt?: string; 
}

export interface Ticket extends Auditable {
  id: string;
  tenantId?: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  customerId: string;
  customerName?: string; 
}

export interface Project extends Auditable {
    id: string;
    tenantId?: string;
    title: string;
    description?: string;
    status: 'Todo' | 'In Progress' | 'Done';
    dueDate?: string; 
}

export interface Message extends Omit<Auditable, 'updatedAt'> {
  id: string;
  tenantId: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  isSystemMessage?: boolean;
}

export interface Reseller extends Auditable {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'Active' | 'Suspended';
  registrationDate: string; 
}

export interface ItemIssuance extends Auditable {
  id: string;
  tenantId?: string;
  resellerId: string;
  resellerName: string;
  itemId: string;
  itemType: 'asset' | 'accessory';
  itemSerialNumber: string;
  itemName: string;
  costPrice: number;
  expectedSellingPrice?: number;
  dateIssued: string; 
  dateSold?: string; 
  dateReturned?: string; 
  status: 'Issued' | 'Sold' | 'Returned';
}

export interface Notification extends Auditable {
  id: string;
  tenantId: string;
  userId?: string; 
  from: string;
  subject: string;
  message: string;
  read: boolean;
  priority: 'info' | 'important' | 'alert';
}

export interface Lease extends Auditable {
    id: string;
    tenantId: string;
    clientType: 'Individual' | 'Corporate';
    customerId: string;
    customerName: string;
    assetId: string;
    laptopModel: string;
    serialNumber: string;
    startDate: string;
    endDate: string;
    duration: number;
    durationUnit: 'Day' | 'Week' | 'Month' | 'Year';
    monthlyPayment?: number;
    status: 'Active' | 'Expired' | 'Terminated' | 'Upcoming';
    paymentStatus: 'Paid' | 'Pending' | 'Overdue';
    signature?: string;
    
    verification?: {
        nationalId?: string;
        guarantorId?: string;
        studentId?: string;
        parentName?: string;
        parentPhone?: string;
        businessPermit?: string;
        cr12Reference?: string;
        directorId?: string;
        contactPerson?: string;
    };
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
