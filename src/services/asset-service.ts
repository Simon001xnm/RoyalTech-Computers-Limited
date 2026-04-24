import { db } from '@/db';
import type { Asset } from "@/types";
import { logger } from "@/lib/logger";

/**
 * @fileOverview Asset Service (Consolidated Dexie Storage)
 * Abstracts database interactions for hardware inventory.
 * Ensures strict tenancy isolation by stamping every record with tenantId.
 */
export const AssetService = {
  /**
   * Creates a new asset with automatic tenancy and logging.
   */
  async create(data: Partial<Asset>, tenantId: string, user: { uid: string; name: string }) {
    if (!tenantId) throw new Error("Tenant ID required for workspace registration.");
    
    const assetData: Asset = {
      ...data,
      id: crypto.randomUUID(),
      tenantId, // CRITICAL: SaaS Isolation
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
      await db.assets.add(assetData);
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
  async update(id: string, updates: Partial<Asset>, tenantId: string) {
    try {
      await db.assets.update(id, {
        ...updates,
        tenantId, // Ensure tenancy persists
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
  async delete(id: string, tenantId: string) {
    try {
      await db.assets.delete(id);
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
  async bulkImport(assets: Asset[], tenantId: string) {
    if (!tenantId) throw new Error("Tenant ID required for bulk import.");
    
    try {
      const stampedAssets = assets.map(a => ({ ...a, tenantId }));
      await db.assets.bulkAdd(stampedAssets);
      logger.business('Inventory', 'Bulk Import Executed', { count: assets.length, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Bulk import failed', error);
      throw error;
    }
  }
};
