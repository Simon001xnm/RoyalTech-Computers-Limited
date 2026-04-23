
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

export interface Company extends Auditable {
  id: string;
  tenantId?: string; // Link to SaaS tenant
  name: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  location?: string;
  website?: string;
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
  avatarUrl?: string;
}

export interface Asset extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  tenantId?: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // ISO string date
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
  purchaseDate: string; // ISO string date
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
  registrationDate: string; // ISO string date
  createdAt?: string; 
  updatedAt?: string; 
}

export interface Document extends Auditable {
  id: string;
  tenantId?: string;
  type: DocumentType;
  title: string;
  generatedDate: string; // ISO string date
  relatedTo?: string; 
  saleId?: string; 
  data: any; 
}

export interface SaleItem {
    id: string;
    name: string;
    serialNumber: string;
    price: number; 
    quantity: number;
    discount?: number;
    type: 'asset' | 'accessory';
    cogs?: number;
}

export interface Sale extends Auditable {
  id: string;
  tenantId?: string;
  date: string; // ISO string date
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
  status: 'Paid' | 'Pending' | 'Void';
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
  tenantId?: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
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

export interface JobPosting extends Auditable {
  id: string;
  tenantId?: string;
  title: string;
  description: string;
  department: string;
  status: 'Open' | 'Closed' | 'Archived';
}

export interface Applicant extends Auditable {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone?: string;
  jobId: string;
  jobTitle?: string; 
  status: 'New' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  resumeUrl?: string;
  notes?: string;
  appliedAt: string; 
}

export type DocumentType = 'Receipt' | 'Invoice' | 'Proforma' | 'RepairNote' | 'DeliveryNote' | 'Quotation' | 'LPO';

export interface DocumentLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}
