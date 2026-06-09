/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let isFirebaseReady = false;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  const isPlaceholder = !firebaseConfig || firebaseConfig.apiKey === "PLACEHOLDER";
  
  if (!isPlaceholder) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseReady = true;

    // Validate connexion to Firestore as per critical directive
    const testConnection = async () => {
      try {
        if (db) {
          await getDocFromServer(doc(db, 'test', 'connection'));
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firestore client is offline. Local cache will be utilized.");
        }
      }
    };
    testConnection();
  }
} catch (e) {
  console.warn("Firebase initialization failed. Defaulting to high-performance local synchronization. Error:", e);
  isFirebaseReady = false;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Access Incident logged: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { isFirebaseReady, auth, db, googleProvider };

export async function loginWithGoogle(): Promise<User | null> {
  if (!isFirebaseReady || !auth || !googleProvider) {
    throw new Error("Cloud synchronization is not active (placeholder configuration found).");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Authentication error:", error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}
