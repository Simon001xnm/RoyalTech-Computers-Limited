
import { db } from "@/db";
import type { Asset } from "@/types";
import { logger } from "@/lib/logger";

/**
 * @fileOverview Asset Service (v3.0 Foundation)
 * Abstracts database interactions for hardware inventory.
 */
export const AssetService = {
  /**
   * Creates a new asset with automatic tenancy and logging.
   */
  async create(data: Partial<Asset>, tenantId: string, user: { uid: string; name: string }) {
    const id = crypto.randomUUID();
    const asset: Asset = {
      ...data as any,
      id,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user
    };

    try {
      await db.assets.add(asset);
      logger.business('Inventory', 'Asset Registered', { id, model: asset.model, tenantId });
      return { success: true, id };
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
    try {
      await db.assets.bulkAdd(assets);
      logger.business('Inventory', 'Bulk Import Success', { count: assets.length, tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Inventory', 'Bulk import failed', error);
      throw error;
    }
  }
};
