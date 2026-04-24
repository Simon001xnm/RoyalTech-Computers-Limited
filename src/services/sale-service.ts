import { Firestore, writeBatch, doc, collection } from 'firebase/firestore';
import type { Sale, Document as AppDocument } from "@/types";
import { logger } from "@/lib/logger";

/**
 * @fileOverview Sale Service (Firestore Cloud)
 * Abstracts transaction logic and inventory updates.
 * Enforces strict multi-tenant isolation.
 */
export const SaleService = {
  /**
   * Finalizes a sale, updates inventory, and generates a receipt in a single atomic batch.
   */
  async finalizeSale(firestore: Firestore, saleData: Sale, receiptDoc: AppDocument) {
    if (!saleData.tenantId) throw new Error("Tenant ID required for transaction.");

    const batch = writeBatch(firestore);

    try {
      // 1. Record the Sale
      const saleRef = doc(collection(firestore, 'sales_transactions'));
      batch.set(saleRef, saleData);

      // 2. Archive the Document
      const docRef = doc(collection(firestore, 'documents'));
      batch.set(docRef, receiptDoc);

      // 3. Update Inventory Statuses
      for (const item of saleData.items) {
        if (item.type === 'asset') {
          const assetRef = doc(firestore, 'assets', item.id);
          batch.update(assetRef, { 
            status: 'Sold', 
            quantity: 0,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Commit the atomic change
      await batch.commit();

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
