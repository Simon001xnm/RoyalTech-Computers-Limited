'use server';
/**
 * @fileOverview Server-side actions for Firebase, intended to be used in Server Components.
 */

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { USER_ROLES } from '@/lib/roles';
import { firebaseConfig } from '@/firebase/config';


// Centralized Firebase Admin App Initialization
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    try {
        return initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
        });
    } catch (e: any) {
        if (
            e.code === 'auth/invalid-credential' || 
            (e.message && e.message.includes('Could not load the default credentials')) ||
            (e.message && e.message.includes('Could not refresh access token'))
        ) {
            throw new Error(
                'Firebase Admin SDK initialization failed: Multi-tenant server setup incomplete. ' +
                'Please ensure GOOGLE_APPLICATION_CREDENTIALS is set in the environment.'
            );
        }
        throw e;
    }
}


const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
  tenantId: z.string().optional(), // Tagging the user with a specific business workspace
  requestingUserRole: z.enum(USER_ROLES).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  success: z.boolean(),
  uid: z.string().optional(),
  error: z.string().optional(),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const adminApp = getAdminApp();
      const auth = getAuth(adminApp);
      const firestore = getFirestore(adminApp);

      // Permission Checks
      if (!input.requestingUserRole || (input.requestingUserRole !== 'admin' && input.requestingUserRole !== 'super_admin')) {
          return { success: false, error: 'Permission Denied: Only Admins can manage the team.' };
      }

      // 1. Create the user in Firebase Authentication
      const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.name,
      });

      // 2. Set custom claims for the user role and tenantId
      // This is crucial for server-side security in v3.0
      await auth.setCustomUserClaims(userRecord.uid, { 
          role: input.role,
          tenantId: input.tenantId 
      });

      // 3. Create the user profile document in Firestore
      const userDocRef = firestore.collection('users').doc(userRecord.uid);
      await userDocRef.set({
        id: userRecord.uid,
        name: input.name,
        email: input.email,
        phone: input.phone || '',
        role: input.role,
        tenantId: input.tenantId || null,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        uid: userRecord.uid,
      };
    } catch (error: any) {
      console.error("Error in createUser server action: ", error);
      switch (error.code) {
        case 'auth/email-already-exists':
          return { success: false, error: 'This email is already registered.' };
        default:
          return { success: false, error: error.message || "Server error during account creation." };
      }
    }
}


const UpdateUserInputSchema = z.object({
  uid: z.string(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  requestingUserRole: z.enum(USER_ROLES).optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export async function updateUser(input: UpdateUserInput): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);
        
        if (!input.requestingUserRole || (input.requestingUserRole !== 'admin' && input.requestingUserRole !== 'super_admin')) {
            return { success: false, error: 'Permission Denied: Only admins can update users.' };
        }
        
        const updates: any = {};
        const firestoreUpdates: any = { updatedAt: new Date().toISOString() };
        
        if (input.password) updates.password = input.password;
        if (input.name) {
            updates.displayName = input.name;
            firestoreUpdates.name = input.name;
        }
        if (input.phone !== undefined) firestoreUpdates.phone = input.phone;
        if (input.role) {
            await auth.setCustomUserClaims(input.uid, { role: input.role });
            firestoreUpdates.role = input.role;
        }

        if (Object.keys(updates).length > 0) await auth.updateUser(input.uid, updates);
        if (Object.keys(firestoreUpdates).length > 1) {
            const userDocRef = firestore.collection('users').doc(input.uid);
            await userDocRef.update(firestoreUpdates);
        }
        
        return { success: true };

    } catch (error: any) {
        console.error("Error in updateUser action: ", error);
        return { success: false, error: error.message || 'Server error during update.' };
    }
}

const SignUpInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});
export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export async function signupAndCreateUser(input: SignUpInput): Promise<{ success: boolean; error?: string }> {
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);

        const usersCollection = firestore.collection('users');
        const snapshot = await usersCollection.limit(1).get();
        const role = snapshot.empty ? 'admin' : 'user';

        const userRecord = await auth.createUser({
            email: input.email,
            password: input.password,
            displayName: input.name,
        });

        await auth.setCustomUserClaims(userRecord.uid, { role });

        const userDocRef = usersCollection.doc(userRecord.uid);
        await userDocRef.set({
            id: userRecord.uid,
            name: input.name,
            email: input.email,
            phone: '',
            role: role,
            tenantId: null, // Initial signup doesn't have a tenant yet
            createdAt: new Date().toISOString(),
        });

        return { success: true };

    } catch (error: any) {
        console.error("Error in signupAndCreateUser: ", error);
        return { success: false, error: error.message || "Failed to create individual account." };
    }
}
