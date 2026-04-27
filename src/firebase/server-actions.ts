
'use server';
/**
 * @fileOverview Server-side actions for Firebase management.
 * Includes a resilient initialization and a Force Reset mechanism for Master Keys.
 */

import { config } from 'dotenv';
config(); 

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { USER_ROLES, MASTER_KEYS } from '@/lib/roles';
import { firebaseConfig } from '@/firebase/config';

let isPrototypeMode = false;

function getAdminApp(): App | null {
    if (getApps().length > 0) return getApps()[0];
    try {
        return initializeApp({ projectId: firebaseConfig.projectId });
    } catch (e: any) {
        console.warn("⚠️ Firebase Admin initialization failed. Falling back to Prototype Mode.");
        isPrototypeMode = true;
        return null;
    }
}

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
  tenantId: z.string().optional(),
  requestingUserRole: z.enum(USER_ROLES).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export async function createUser(input: CreateUserInput): Promise<{ success: boolean; uid?: string; error?: string }> {
    try {
      const adminApp = getAdminApp();
      if (!input.requestingUserRole || (input.requestingUserRole !== 'admin' && input.requestingUserRole !== 'super_admin')) {
          return { success: false, error: 'Permission Denied.' };
      }

      let uid = crypto.randomUUID();

      if (adminApp && !isPrototypeMode) {
          try {
            const auth = getAuth(adminApp);
            const userRecord = await auth.createUser({
                email: input.email,
                password: input.password,
                displayName: input.name,
            });
            uid = userRecord.uid;
            await auth.setCustomUserClaims(uid, { role: input.role, tenantId: input.tenantId });
          } catch (authError: any) {
             if (authError.message.includes('credential')) isPrototypeMode = true;
             else throw authError;
          }
      }

      if (adminApp) {
          const firestore = getFirestore(adminApp);
          await firestore.collection('users').doc(uid).set({
            id: uid,
            name: input.name,
            email: input.email,
            phone: input.phone || '',
            role: input.role,
            tenantId: input.tenantId || null,
            createdAt: new Date().toISOString(),
          });
      }
      return { success: true, uid };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}

/**
 * Force Reset Master Account: Deregisters a Master Key account so it can be re-registered.
 */
export async function forceResetMasterAccount(email: string): Promise<{ success: boolean; error?: string }> {
    if (!MASTER_KEYS.includes(email.toLowerCase())) {
        return { success: false, error: "Only official Master Keys can be force-reset via this endpoint." };
    }

    try {
        const adminApp = getAdminApp();
        if (!adminApp) throw new Error("Admin infrastructure unavailable.");
        
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);
        
        try {
            const user = await auth.getUserByEmail(email.toLowerCase());
            await auth.deleteUser(user.uid);
            await firestore.collection('users').doc(user.uid).delete();
        } catch (e) {
            // User might not exist, which is fine
        }
        
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUser(input: any): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = getAdminApp();
        if (!adminApp) return { success: true };
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);
        const updates: any = { updatedAt: new Date().toISOString() };
        if (input.name) updates.name = input.name;
        if (input.role) {
            if (!isPrototypeMode) await auth.setCustomUserClaims(input.uid, { role: input.role });
            updates.role = input.role;
        }
        await firestore.collection('users').doc(input.uid).update(updates);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
