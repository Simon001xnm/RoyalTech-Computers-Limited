
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
  role: 'admin' | 'user';
  avatarUrl?: string;
}

export interface Asset extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // ISO string date
  status: 'Available' | 'Leased' | 'Repair' | 'Sold' | 'With Reseller';
  quantity: number; 
  location?: { lat: number; lng: number }; // For map tracking
  specifications?: {
    ram: string;
    storage: string;
    processor: string;
    touchscreen?: boolean;
  };
  purchasePrice?: number;
  leasePrice?: number;
  createdAt?: string; // from Auditable
  updatedAt?: string; // from Auditable
}

export interface Accessory extends Omit<Auditable, 'createdAt' | 'updatedAt'> {
  id: string;
  name: string;
  serialNumber: string;
  purchaseDate: string; // ISO string date
  status: 'Available' | 'Sold' | 'With Reseller';
  quantity: number;
  purchasePrice?: number;
  sellingPrice: number;
  createdAt?: string; // from Auditable
  updatedAt?: string; // from Auditable
}

export interface Customer extends Omit<Auditable, 'createdAt' | 'updatedAt'>{
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  registrationDate: string; // ISO string date
  createdAt?: string; // from Auditable
  updatedAt?: string; // from Auditable
}

export interface Lease extends Auditable {
  id:string;
  customerId: string;
  customerName?: string; // Denormalized for display
  assetId: string;
  assetModel?: string; // Denormalized for display
  startDate: string; // ISO string date
  endDate: string; // ISO string date
  monthlyPayment?: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  status: 'Active' | 'Expired' | 'Terminated' | 'Upcoming';
  signature?: string; // Base64 signature image
}

export type DocumentType = 'Receipt' | 'Invoice' | 'Proforma' | 'RepairNote' | 'DeliveryNote' | 'LeaseAgreement' | 'Quotation' | 'LPO';

export interface DocumentLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Document extends Auditable {
  id: string;
  type: DocumentType;
  title: string;
  generatedDate: string; // ISO string date
  relatedTo?: string; // e.g., Customer Name, Asset S/N
  saleId?: string; // Direct link to a POS sale
  data: any; // Data used to generate the document
}

export interface SaleItem {
    id: string;
    name: string;
    serialNumber: string;
    price: number; // Represents Unit Price
    quantity: number;
    discount?: number;
    type: 'asset' | 'accessory';
    specifications?: {
        ram: string;
        storage: string;
        processor: string;
        touchscreen?: boolean;
    };
    cogs?: number;
}

export interface Sale extends Auditable {
  id: string;
  date: string; // ISO string date
  amount: number; // Represents Grand Total
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
  date: string; // ISO string date
  category: string;
  amount: number;
  notes?: string;
}

export interface Campaign extends Auditable {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'Draft' | 'Sent' | 'Archived';
  audience: {
    type: 'all' | 'segment';
    customerIds?: string[];
  };
  sentAt?: string; // ISO string date
}

export interface Ticket extends Auditable {
  id: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  customerId: string;
  customerName?: string; // Denormalized
  leaseId?: string;
  leaseIdentifier?: string; // Denormalized
}

export interface Project extends Auditable {
    id: string;
    title: string;
    description?: string;
    status: 'Todo' | 'In Progress' | 'Done';
    dueDate?: string; // ISO string date
}

export interface Message extends Omit<Auditable, 'updatedAt'> {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface Reseller extends Auditable {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'Active' | 'Suspended';
  registrationDate: string; // ISO string date
}

export interface ItemIssuance extends Auditable {
  id: string;
  resellerId: string;
  resellerName: string;
  itemId: string;
  itemType: 'asset' | 'accessory';
  itemSerialNumber: string;
  itemName: string;
  costPrice: number;
  expectedSellingPrice?: number;
  dateIssued: string; // ISO string date
  dateSold?: string; // ISO string date
  dateReturned?: string; // ISO string date
  status: 'Issued' | 'Sold' | 'Returned';
}

export interface JobPosting extends Auditable {
  id: string;
  title: string;
  description: string;
  department: string;
  status: 'Open' | 'Closed' | 'Archived';
}

export interface Applicant extends Auditable {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobId: string;
  jobTitle?: string; // Denormalized
  status: 'New' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  resumeUrl?: string;
  notes?: string;
  appliedAt: string; // ISO string date
}
