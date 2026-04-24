
import { Firestore, collection, doc, serverTimestamp } from 'firebase/firestore';
import type { Asset } from "@/types";
import { logger } from "@/lib/logger";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

/**
 * @fileOverview Asset Service (Firestore Integrated)
 * Abstracts database interactions for hardware inventory using Firebase.
 */
export const AssetService = {
  /**
   * Creates a new asset with automatic tenancy and logging.
   */
  async create(firestore: Firestore, data: Partial<Asset>, tenantId: string, user: { uid: string; name: string }) {
    const colRef = collection(firestore, 'laptop_instances');
    const assetData = {
      ...data,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user,
      specifications: {
        ram: (data as any).ram || '',
        storage: (data as any).storage || '',
        processor: (data as any).processor || ''
      }
    };

    try {
      addDocumentNonBlocking(colRef, assetData);
      logger.business('Inventory', 'Asset Registered', { model: (data as any).model, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Failed to register asset', error);
      throw error;
    }
  },

  /**
   * Updates an existing asset.
   */
  async update(firestore: Firestore, id: string, updates: Partial<Asset>, tenantId: string) {
    const docRef = doc(firestore, 'laptop_instances', id);
    try {
      updateDocumentNonBlocking(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      logger.business('Inventory', 'Asset Updated', { id, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Update failed', error);
      throw error;
    }
  },

  /**
   * Deletes an asset.
   */
  async delete(firestore: Firestore, id: string, tenantId: string) {
    const docRef = doc(firestore, 'laptop_instances', id);
    try {
      deleteDocumentNonBlocking(docRef);
      logger.business('Inventory', 'Asset Removed', { id, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Deletion failed', error);
      throw error;
    }
  },

  /**
   * Bulk imports assets.
   */
  async bulkImport(firestore: Firestore, assets: Asset[], tenantId: string) {
    const colRef = collection(firestore, 'laptop_instances');
    try {
      for (const asset of assets) {
        addDocumentNonBlocking(colRef, { ...asset, tenantId });
      }
      logger.business('Inventory', 'Bulk Import Triggered', { count: assets.length, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Bulk import failed', error);
      throw error;
    }
  }
};
