
import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { 
  Asset, 
  Accessory, 
  Customer, 
  Lease, 
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
 */
export class RoyalTechDB extends Dexie {
  assets!: Table<Asset>;
  accessories!: Table<Accessory>;
  customers!: Table<Customer>;
  leases!: Table<Lease>;
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
    
    // Define tables and indexes
    this.version(1).stores({
      assets: 'id, model, serialNumber, status, purchaseDate',
      accessories: 'id, name, serialNumber, status',
      customers: 'id, name, email, phone',
      leases: 'id, customerId, assetId, status, endDate',
      documents: 'id, type, title, generatedDate, saleId', // Added saleId for POS document lookup
      sales: 'id, date, customerId, resellerId',
      expenses: 'id, date, category',
      projects: 'id, status, dueDate',
      tickets: 'id, status, customerId',
      resellers: 'id, name, status',
      itemIssuances: 'id, resellerId, itemId, status',
      messages: 'id, createdAt',
      users: 'id, email, role',
      campaigns: 'id, status, createdAt',
      jobPostings: 'id, status, createdAt',
      applicants: 'id, jobId, status, appliedAt',
      companies: 'id, name'
    });

    this.cloud.configure({
      databaseUrl: 'https://z1xwh7v7u.dexie.cloud',
      requireAuth: false 
    });
  }
}

export const db = new RoyalTechDB();
