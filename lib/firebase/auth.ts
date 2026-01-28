import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, type DocumentData } from "firebase/firestore";
import { auth, db } from "./config";

export interface ProfileData {
  displayName?: string;
  photoURL?: string;
  [key: string]: unknown;
}

export interface UserSession {
  user: User;
  profile?: DocumentData;
}

/**
 * Sign up a new user with email and password
 * @param email - User email address
 * @param password - User password
 * @param profileData - Optional profile data to store in Firestore
 * @returns UserCredential with user information
 */
export async function signUp(
  email: string,
  password: string,
  profileData?: ProfileData
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Save profile data to Firestore if provided
    if (profileData && userCredential.user) {
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return userCredential;
  } catch (error) {
    throw error;
  }
}

/**
 * Sign in an existing user with email and password
 * @param email - User email address
 * @param password - User password
 * @returns UserCredential with user information
 */
export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw error;
  }
}

/**
 * Get the current user session with profile data
 * @returns Promise resolving to UserSession or null if no user is signed in
 */
export async function getSession(): Promise<UserSession | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        // Fetch user profile from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        resolve({
          user,
          profile: userSnap.exists() ? userSnap.data() : undefined,
        });
      } catch (error) {
        // If profile fetch fails, still return user session
        resolve({ user });
      }
    });
  });
}

