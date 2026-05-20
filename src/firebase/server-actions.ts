'use server';
/**
 * @fileOverview Server-side actions for Firebase management.
 * Includes a resilient initialization and Prototype Mode fallback.
 */

import { config } from 'dotenv';
config(); 

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { USER_ROLES } from '@/lib/roles';
import { firebaseConfig } from '@/firebase/config';
import { randomUUID } from 'crypto';

let isPrototypeMode = false;

function getAdminApp(): App | null {
    if (getApps().length > 0) return getApps()[0];
    try {
        // Attempt to initialize using basic project ID
        // This works if running on Google Cloud or with ADC
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
  tenantId: z.string().optional().nullable(),
  requestingUserRole: z.enum(USER_ROLES).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export async function createUser(input: CreateUserInput): Promise<{ success: boolean; uid?: string; error?: string }> {
    try {
      const adminApp = getAdminApp();
      
      // Permission check (Only admins can create users)
      if (!input.requestingUserRole || (input.requestingUserRole !== 'admin' && input.requestingUserRole !== 'super_admin')) {
          return { success: false, error: 'Permission Denied: Unauthorized role attempt.' };
      }

      let uid = randomUUID();

      // Attempt to create Auth user if Admin SDK is healthy
      if (adminApp && !isPrototypeMode) {
          try {
            const auth = getAuth(adminApp);
            const userRecord = await auth.createUser({
                email: input.email,
                password: input.password,
                displayName: input.name,
            });
            uid = userRecord.uid;
            
            // Set custom claims for tenancy and roles
            await auth.setCustomUserClaims(uid, { 
                role: input.role, 
                tenantId: input.tenantId 
            });
          } catch (authError: any) {
             // If we get a credential error, we are in a dev environment without a service account
             if (authError.message.includes('credential') || authError.code === 'app/invalid-credential') {
                 console.warn("Auth creation skipped: No Service Account credentials found.");
                 isPrototypeMode = true;
             } else {
                 throw authError;
             }
          }
      }

      // Sync user profile to Firestore (Always works if database is in test mode)
      // We import firestore inside the block to ensure lazy loading
      const { firestore } = await import('@/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      // Note: We use the client SDK initializeFirebase here because adminApp might be null
      // and we want to ensure the document is created regardless.
      const usersRef = doc(firestore, 'users', uid);
      await setDoc(usersRef, {
          id: uid,
          name: input.name,
          email: input.email,
          phone: input.phone || '',
          role: input.role,
          tenantId: input.tenantId || null,
          tenantIds: input.tenantId ? [input.tenantId] : [],
          createdAt: new Date().toISOString(),
          isProvisioned: !isPrototypeMode
      });

      return { success: true, uid };
    } catch (error: any) {
      console.error("Critical Server Action Failure [createUser]:", error);
      return { success: false, error: error.message || 'Internal Server Exception' };
    }
}

export async function updateUser(input: any): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = getAdminApp();
        const { firestore } = await import('@/firebase');
        const { doc, updateDoc } = await import('firebase/firestore');

        const updates: any = { updatedAt: new Date().toISOString() };
        if (input.name) updates.name = input.name;
        if (input.phone) updates.phone = input.phone;
        
        if (input.role) {
            updates.role = input.role;
            // Attempt to sync role to custom claims if possible
            if (adminApp && !isPrototypeMode) {
                try {
                    const auth = getAuth(adminApp);
                    await auth.setCustomUserClaims(input.uid, { role: input.role });
                } catch (e) {
                    console.debug("Claim sync skipped.");
                }
            }
        }
        
        const userRef = doc(firestore, 'users', input.uid);
        await updateDoc(userRef, updates);
        
        return { success: true };
    } catch (error: any) {
        console.error("Critical Server Action Failure [updateUser]:", error);
        return { success: false, error: error.message || 'Internal Server Exception' };
    }
}
