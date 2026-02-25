
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';


/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, callback?: () => void): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid credentials. Please check your email and password.',
            });
        } else {
            // Handle other potential errors, e.g., network issues
            toast({
                variant: 'destructive',
                title: 'An Error Occurred',
                description: error.message || 'Could not sign in. Please try again later.',
            });
        }
        console.error("Email sign-in error:", error);
    })
    .finally(() => {
        callback?.();
    });
}
