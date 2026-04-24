
import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { 
  Asset, 
  Accessory, 
  Customer, 
  Document as AppDocument, 
  Sale, 
  Expense, 
  Project, 
  Ticket, 
  Reseller, 
  ItemIssuance,
  Message,
  User,
  Campaign,
  JobPosting,
  Applicant,
  Company,
  Notification
} from '@/types';

export interface PlatformLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'business';
  module: string;
  event: string;
  tenantId?: string;
  userId?: string;
  metadata?: any;
}

/**
 * RoyalTechDB: Hardened for Next.js SSR.
 * Initialization of dexie-cloud is deferred to avoid Illegal Invocation errors.
 */
export class RoyalTechDB extends Dexie {
  assets!: Table<Asset>;
  accessories!: Table<Accessory>;
  customers!: Table<Customer>;
  documents!: Table<AppDocument>;
  sales!: Table<Sale>;
  expenses!: Table<Expense>;
  projects!: Table<Project>;
  tickets!: Table<Ticket>;
  resellers!: Table<Reseller>;
  itemIssuances!: Table<ItemIssuance>;
  messages!: Table<Message>;
  users!: Table<User>;
  campaigns!: Table<Campaign>;
  jobPostings!: Table<JobPosting>;
  applicants!: Table<Applicant>;
  companies!: Table<Company>;
  platformLogs!: Table<PlatformLog>;
  notifications!: Table<Notification>;

  constructor() {
    super('RoyalTechDB', { addons: [dexieCloud] });
    
    this.version(4).stores({
      assets: 'id, tenantId, model, serialNumber, status, purchaseDate',
      accessories: 'id, tenantId, name, serialNumber, status',
      customers: 'id, tenantId, name, email, phone',
      documents: 'id, tenantId, type, title, generatedDate, saleId',
      sales: 'id, tenantId, date, customerId, resellerId',
      expenses: 'id, tenantId, date, category',
      projects: 'id, tenantId, status, dueDate',
      tickets: 'id, tenantId, status, customerId',
      resellers: 'id, tenantId, name, status',
      itemIssuances: 'id, tenantId, resellerId, itemId, status',
      messages: 'id, tenantId, createdAt',
      users: 'id, tenantId, email, role',
      campaigns: 'id, tenantId, status, createdAt',
      jobPostings: 'id, tenantId, status, createdAt',
      applicants: 'id, tenantId, jobId, status, appliedAt',
      companies: 'id, tenantId, name',
      platformLogs: 'id, level, module, tenantId, timestamp',
      notifications: 'id, tenantId, userId, read, createdAt'
    });

    // Only configure cloud if in the browser
    if (typeof window !== 'undefined') {
        this.cloud.configure({
          databaseUrl: 'https://z1xwh7v7u.dexie.cloud',
          requireAuth: false 
        });
    }
  }
}

export const db = new RoyalTechDB();
