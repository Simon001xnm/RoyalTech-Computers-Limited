import { db } from '@/db';
import type { Sale, Document as AppDocument } from "@/types";
import { logger } from "@/lib/logger";

/**
 * @fileOverview Sale Service (Consolidated Dexie Storage)
 * Abstracts transaction logic and inventory updates.
 * Enforces strict multi-tenant isolation.
 */
export const SaleService = {
  /**
   * Finalizes a sale, updates inventory, and generates a receipt.
   */
  async finalizeSale(saleData: Sale, receiptDoc: AppDocument) {
    if (!saleData.tenantId) throw new Error("Tenant ID required for transaction.");

    try {
      await db.transaction('rw', [db.sales, db.documents, db.assets], async () => {
        // 1. Record the Sale
        await db.sales.add(saleData);

        // 2. Archive the Document
        await db.documents.add(receiptDoc);

        // 3. Update Inventory Statuses
        for (const item of saleData.items) {
          if (item.type === 'asset') {
            await db.assets.update(item.id, { 
              status: 'Sold', 
              quantity: 0,
              tenantId: saleData.tenantId // Preserve isolation
            });
          }
        }
      });

      logger.business('POS', 'Transaction Finalized', { 
        id: saleData.id, 
        amount: saleData.amount, 
        tenantId: saleData.tenantId 
      });

      return { success: true };
    } catch (error: any) {
      logger.error('POS', 'Sale Finalization Failed', error);
      throw error;
    }
  }
};
