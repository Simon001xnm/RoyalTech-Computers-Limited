import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { 
  Laptop, 
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
  User
} from '@/types';

/**
 * RoyalTech Local Database
 * Powered by Dexie.js and IndexedDB for local-first storage.
 * Synchronized via Dexie Cloud.
 */
export class RoyalTechDB extends Dexie {
  laptops!: Table<Laptop>;
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

  constructor() {
    super('RoyalTechDB', { addons: [dexieCloud] });
    
    // Define tables and indexes
    this.version(1).stores({
      laptops: 'id, model, serialNumber, status, purchaseDate',
      accessories: 'id, name, serialNumber, status',
      customers: 'id, name, email, phone',
      leases: 'id, customerId, laptopId, status, endDate',
      documents: 'id, type, title, generatedDate',
      sales: 'id, date, customerId, resellerId',
      expenses: 'id, date, category',
      projects: 'id, status, dueDate',
      tickets: 'id, status, customerId',
      resellers: 'id, name, status',
      itemIssuances: 'id, resellerId, itemId, status',
      messages: 'id, createdAt',
      users: 'id, email, role'
    });

    this.cloud.configure({
      databaseUrl: 'https://z1xwh7v7u.dexie.cloud',
      requireAuth: false // Changed to false to prevent the login prompt. Data stays local until sync is manually triggered or configured.
    });
  }
}

export const db = new RoyalTechDB();
