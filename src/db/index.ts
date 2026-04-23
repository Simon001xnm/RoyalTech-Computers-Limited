
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
  Company
} from '@/types';

/**
 * Professional ERP Suite Local Database
 * Powered by Dexie.js and IndexedDB for local-first storage.
 * Version 2: Multi-tenancy Indexing Upgrade.
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

  constructor() {
    super('RoyalTechDB', { addons: [dexieCloud] });
    
    // Version 2: Adding tenantId to all major store indices for SaaS isolation
    this.version(2).stores({
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
      companies: 'id, tenantId, name'
    });

    this.cloud.configure({
      databaseUrl: 'https://z1xwh7v7u.dexie.cloud',
      requireAuth: false 
    });
  }
}

export const db = new RoyalTechDB();
