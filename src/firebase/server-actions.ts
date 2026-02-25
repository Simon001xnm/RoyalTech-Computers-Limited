
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

    // In a managed environment like this one, we must check for credentials.
    // The `applicationDefault()` will throw an `auth/invalid-credential` error if it cannot
    // find credentials in the environment. This is a common scenario in local development
    // or misconfigured servers. We catch this to provide a clearer error message.
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
                'Firebase Admin SDK initialization failed: Could not load default credentials. ' +
                'Please ensure your server environment is configured correctly. ' +
                'This might involve setting the GOOGLE_APPLICATION_CREDENTIALS environment variable ' +
                'or running `gcloud auth application-default login`.'
            );
        }
        // Re-throw any other initialization errors
        throw e;
    }
}


const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
  requestingUserRole: z.enum(USER_ROLES).optional(), // Role of the user making the request
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

      // This server action is now only for creation by an administrator.
      if (!input.requestingUserRole || input.requestingUserRole !== 'admin') {
          return { success: false, error: 'Permission Denied: Only Admins can create users.' };
      }
      
      const roleToAssign = input.role;
      if (roleToAssign === 'admin' && input.requestingUserRole !== 'admin') {
            return { success: false, error: 'Permission Denied: Only Admins can create other Admins.' };
      }

      // 1. Create the user in Firebase Authentication
      const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.name,
      });

      // 2. Set custom claims for the user role
      await auth.setCustomUserClaims(userRecord.uid, { role: roleToAssign });

      // 3. Create the user profile document in Firestore
      const userDocRef = firestore.collection('users').doc(userRecord.uid);
      await userDocRef.set({
        id: userRecord.uid,
        name: input.name,
        email: input.email,
        phone: input.phone || '',
        role: roleToAssign,
      });

      return {
        success: true,
        uid: userRecord.uid,
      };
    } catch (error: any) {
      console.error("Error in createUser server action: ", error);
       if (error.message && error.message.includes('Could not refresh access token')) {
            return { success: false, error: 'Server authentication error. This may be due to project billing status or permissions. Please check your Vercel/Firebase project configuration.' };
        }
       if (error.code === 'auth/invalid-credential' || (error.message && error.message.includes('credential'))) {
          return { success: false, error: 'Server authentication error. Please check your Firebase Admin SDK credentials.' };
      }
      switch (error.code) {
        case 'auth/email-already-exists':
          return { success: false, error: 'A user with this email already exists.' };
        case 'auth/invalid-email':
          return { success: false, error: 'The email address is not valid. Please check for typos.' };
        case 'auth/invalid-password':
          return { success: false, error: 'The password must be at least 6 characters long.' };
        default:
          const errorMessage = error.message || "An unknown server error occurred.";
          return { success: false, error: errorMessage };
      }
    }
}


// --- Update User ---
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
        
        // --- Permission Checks ---
        if (!input.requestingUserRole || input.requestingUserRole !== 'admin') {
            return { success: false, error: 'Permission Denied: Only admins can update users.' };
        }
        
        const updates: any = {};
        const firestoreUpdates: any = {};
        
        // Update password in Auth
        if (input.password) {
            updates.password = input.password;
        }

        // Update display name in Auth
        if (input.name) {
            updates.displayName = input.name;
            firestoreUpdates.name = input.name;
        }

        // Update phone number in Firestore
        if (input.phone !== undefined) {
            firestoreUpdates.phone = input.phone;
        }

        // Update role in claims and Firestore
        if (input.role) {
             if (input.role === 'admin' && input.requestingUserRole !== 'admin') {
                return { success: false, error: 'Permission Denied: Cannot assign Admin role.' };
            }
            await auth.setCustomUserClaims(input.uid, { role: input.role });
            firestoreUpdates.role = input.role;
        }

        // Perform updates
        if (Object.keys(updates).length > 0) {
            await auth.updateUser(input.uid, updates);
        }
        if (Object.keys(firestoreUpdates).length > 0) {
            const userDocRef = firestore.collection('users').doc(input.uid);
            await userDocRef.update(firestoreUpdates);
        }
        
        return { success: true };

    } catch (error: any) {
        console.error("Error in updateUser server action: ", error);
        if (error.message && error.message.includes('Could not refresh access token')) {
            return { success: false, error: 'Server authentication error. This may be due to project billing status or permissions. Please check your Vercel/Firebase project configuration.' };
        }
        if (error.code === 'auth/invalid-credential' || (error.message && error.message.includes('credential'))) {
          return { success: false, error: 'Server authentication error. Please check your Firebase Admin SDK credentials.' };
        }
        return { success: false, error: error.message || 'An unknown server error occurred.' };
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

        // Check if it's the first user to determine the role
        const usersCollection = firestore.collection('users');
        const snapshot = await usersCollection.limit(1).get();
        const role = snapshot.empty ? 'admin' : 'user';

        // 1. Create the user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: input.email,
            password: input.password,
            displayName: input.name,
        });

        // 2. Set custom claims for the user role
        await auth.setCustomUserClaims(userRecord.uid, { role });

        // 3. Create the user profile document in Firestore
        const userDocRef = usersCollection.doc(userRecord.uid);
        await userDocRef.set({
            id: userRecord.uid,
            name: input.name,
            email: input.email,
            phone: '', // phone is optional, default to empty
            role: role,
        });

        return { success: true };

    } catch (error: any) {
        // Same error handling as createUser
        console.error("Error in signupAndCreateUser server action: ", error);
        if (error.message && error.message.includes('Could not refresh access token')) {
            return { success: false, error: 'Server authentication error. This may be due to project billing status or permissions. Please check your Vercel/Firebase project configuration.' };
        }
        if (error.code === 'auth/invalid-credential' || (error.message && error.message.includes('credential'))) {
          return { success: false, error: 'Server authentication error. Please check your Firebase Admin SDK credentials.' };
        }
        switch (error.code) {
          case 'auth/email-already-exists':
            return { success: false, error: 'A user with this email already exists.' };
          case 'auth/invalid-email':
            return { success: false, error: 'The email address is not valid. Please check for typos.' };
          case 'auth/invalid-password':
            return { success: false, error: 'The password must be at least 6 characters long.' };
          default:
            const errorMessage = error.message || "An unknown server error occurred.";
            return { success: false, error: errorMessage };
        }
    }
}
