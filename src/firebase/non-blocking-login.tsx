'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in. Returns promise. */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up. Returns promise for UI error handling. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in. Returns promise for UI error handling. */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // CRITICAL: Must return the promise so the UI can catch errors
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in. Returns promise for UI error handling. */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // Ensure we always prompt for account selection
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(authInstance, provider);
}

/** 
 * Initiate Password Reset Email with Custom Action URL. 
 * Redirects user to the custom domain after reset.
 */
export function initiatePasswordReset(authInstance: Auth, email: string): Promise<void> {
  const actionCodeSettings = {
    // URL to redirect back to after password reset
    url: "https://businesshub.co.ke/login",
    handleCodeInApp: false,
  };
  
  return sendPasswordResetEmail(authInstance, email, actionCodeSettings);
}
