
import { db } from "@/db";
import type { Sale, Document as AppDocument } from "@/types";
import { logger } from "@/lib/logger";

/**
 * @fileOverview Sale Service (v3.0 Foundation)
 * Abstracts transaction logic and inventory updates.
 */
export const SaleService = {
  /**
   * Finalizes a sale, updates inventory, and generates a receipt.
   */
  async finalizeSale(saleData: Sale, receiptDoc: AppDocument) {
    try {
      await db.transaction('rw', [db.assets, db.accessories, db.sales, db.documents], async () => {
        // 1. Update Inventory Statuses
        for (const item of saleData.items) {
          if (item.type === 'asset') {
            await db.assets.update(item.id, { status: 'Sold', quantity: 0 });
          } else {
            const acc = await db.accessories.get(item.id);
            if (acc) {
              const newQty = Math.max(0, (acc.quantity || 0) - item.quantity);
              await db.accessories.update(item.id, { 
                quantity: newQty,
                status: newQty === 0 ? 'Sold' : acc.status 
              });
            }
          }
        }

        // 2. Record the Sale
        await db.sales.add(saleData);

        // 3. Archive the Document
        await db.documents.add(receiptDoc);
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
