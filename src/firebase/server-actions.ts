'use server';
/**
 * @fileOverview Server-side actions for Firebase management.
 * Uses only firebase-admin to prevent 'bind' errors caused by client-SDK leakage.
 */

import { config } from 'dotenv';
config(); 

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { USER_ROLES } from '@/lib/roles';
import { firebaseConfig } from '@/firebase/config';
import { randomUUID } from 'crypto';

function getAdminApp(): App {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
}

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
  tenantId: z.string().optional().nullable(),
  requestingUserRole: z.enum(USER_ROLES).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export async function createUser(input: CreateUserInput): Promise<{ success: boolean; uid?: string; error?: string }> {
    try {
      const adminApp = getAdminApp();
      const auth = getAuth(adminApp);
      const db = getFirestore(adminApp);
      
      if (!input.requestingUserRole || (input.requestingUserRole !== 'admin' && input.requestingUserRole !== 'super_admin')) {
          return { success: false, error: 'Permission Denied' };
      }

      // 1. Create Auth User
      const userRecord = await auth.createUser({
          email: input.email,
          password: input.password,
          displayName: input.name,
      });

      // 2. Set Custom Claims for SaaS isolation
      await auth.setCustomUserClaims(userRecord.uid, { 
          role: input.role, 
          tenantId: input.tenantId 
      });

      // 3. Sync to Firestore using Admin SDK (Server-safe)
      await db.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          name: input.name,
          email: input.email,
          phone: input.phone || '',
          role: input.role,
          tenantId: input.tenantId || null,
          tenantIds: input.tenantId ? [input.tenantId] : [],
          createdAt: new Date().toISOString(),
          status: 'active'
      });

      return { success: true, uid: userRecord.uid };
    } catch (error: any) {
      console.error("Server Action Failure [createUser]:", error);
      return { success: false, error: error.message || 'Internal Server Error' };
    }
}

export async function updateUser(input: any): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const db = getFirestore(adminApp);

        const updates: any = { updatedAt: new Date().toISOString() };
        if (input.name) updates.name = input.name;
        if (input.phone) updates.phone = input.phone;
        
        if (input.role) {
            updates.role = input.role;
            await auth.setCustomUserClaims(input.uid, { role: input.role });
        }
        
        await db.collection('users').doc(input.uid).update(updates);
        return { success: true };
    } catch (error: any) {
        console.error("Server Action Failure [updateUser]:", error);
        return { success: false, error: error.message || 'Internal Server Error' };
    }
}
