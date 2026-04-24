import { Firestore, collection, doc } from 'firebase/firestore';
import type { Sale, Document as AppDocument } from "@/types";
import { logger } from "@/lib/logger";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

/**
 * @fileOverview Sale Service (Firestore Integrated)
 * Abstracts transaction logic and inventory updates via Firebase.
 * Enforces strict multi-tenant isolation.
 */
export const SaleService = {
  /**
   * Finalizes a sale, updates inventory, and generates a receipt.
   */
  async finalizeSale(firestore: Firestore, saleData: Sale, receiptDoc: AppDocument) {
    if (!saleData.tenantId) throw new Error("Tenant ID required for cloud transaction.");

    try {
      // 1. Record the Sale
      const salesCol = collection(firestore, 'sales_transactions');
      addDocumentNonBlocking(salesCol, saleData);

      // 2. Archive the Document
      const docsCol = collection(firestore, 'documents');
      addDocumentNonBlocking(docsCol, receiptDoc);

      // 3. Update Inventory Statuses
      for (const item of saleData.items) {
        if (item.type === 'asset') {
          const assetRef = doc(firestore, 'laptop_instances', item.id);
          // Non-blocking update ensures the POS UI stays responsive
          updateDocumentNonBlocking(assetRef, { 
            status: 'Sold', 
            quantity: 0,
            tenantId: saleData.tenantId // Preserve isolation
          });
        }
      }

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
