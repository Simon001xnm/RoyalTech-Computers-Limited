import { Firestore, doc, collection, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Asset } from "@/types";
import { logger } from "@/lib/logger";

/**
 * @fileOverview Asset Service (Firestore Cloud)
 * Abstracts database interactions for hardware inventory.
 * Ensures strict tenancy isolation by stamping every record with tenantId.
 */
export const AssetService = {
  /**
   * Creates a new asset with automatic tenancy and logging.
   */
  async create(firestore: Firestore, data: Partial<Asset>, tenantId: string, user: { uid: string; name: string }) {
    if (!tenantId) throw new Error("Tenant ID required for workspace registration.");
    
    const assetRef = doc(collection(firestore, 'assets'));
    const assetData: Asset = {
      ...data,
      id: assetRef.id,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user,
      specifications: {
        ram: (data as any).ram || '',
        storage: (data as any).storage || '',
        processor: (data as any).processor || ''
      }
    } as any;

    try {
      await setDoc(assetRef, assetData);
      logger.business('Inventory', 'Asset Registered', { model: assetData.model, tenantId });
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
    try {
      const assetRef = doc(firestore, 'assets', id);
      await updateDoc(assetRef, {
        ...updates,
        tenantId,
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
  async delete(firestore: Firestore, id: string) {
    try {
      const assetRef = doc(firestore, 'assets', id);
      await deleteDoc(assetRef);
      logger.business('Inventory', 'Asset Removed', { id });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Deletion failed', error);
      throw error;
    }
  },

  /**
   * Bulk imports assets using batches.
   */
  async bulkImport(firestore: Firestore, assets: Asset[], tenantId: string) {
    if (!tenantId) throw new Error("Tenant ID required for bulk import.");
    
    const batch = writeBatch(firestore);
    try {
      assets.forEach(asset => {
        const assetRef = doc(collection(firestore, 'assets'));
        batch.set(assetRef, { ...asset, id: assetRef.id, tenantId });
      });
      await batch.commit();
      logger.business('Inventory', 'Bulk Import Executed', { count: assets.length, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Bulk import failed', error);
      throw error;
    }
  }
};
