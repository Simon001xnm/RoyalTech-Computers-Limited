
'use server';
/**
 * @fileOverview Server Actions Stub
 * Granular User Management has been moved to client-side Firestore SDK to resolve 
 * Google OAuth2 credential issues in the prototype environment.
 */

export async function createUser(input: any): Promise<{ success: boolean; error: string }> {
    return { success: false, error: 'Module deprecated. Use client-side provisioning.' };
}

export async function updateUser(input: any): Promise<{ success: boolean; error: string }> {
    return { success: false, error: 'Module deprecated. Use client-side provisioning.' };
}
