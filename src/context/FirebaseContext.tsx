import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle as firebaseGoogleSignIn,
  signInWithEmail as firebaseEmailSignIn,
  registerWithEmail as firebaseEmailRegister,
  logOut as firebaseLogOut,
  testConnection,
} from '../lib/firebase';
import {
  syncUserProfile,
  subscribeUserProfile,
  UserProfileDoc,
} from '../services/firestoreService';
import { UserRole } from '../types';

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfileDoc | null;
  loading: boolean;
  isFirebaseReady: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: (role?: UserRole) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string, role?: UserRole) => Promise<User | null>;
  registerWithEmail: (email: string, pass: string, displayName: string, role?: UserRole) => Promise<User | null>;
  logOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfileDoc>) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isFirebaseReady: false,
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  signInWithGoogle: async () => null,
  signInWithEmail: async () => null,
  registerWithEmail: async () => null,
  logOut: async () => {},
  updateUserProfile: async () => {},
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Validate connection on boot
    testConnection();

    // 2. Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsFirebaseReady(true);
      if (currentUser) {
        let activeRole: UserRole | undefined;
        try {
          const stored = localStorage.getItem('soulcare_user_role') as UserRole;
          if (stored === 'expert' || stored === 'user' || stored === 'admin') {
            activeRole = stored;
          }
        } catch {
          // ignore
        }
        // Sync basic profile
        await syncUserProfile({
          userId: currentUser.uid,
          email: currentUser.email || '',
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Người dùng SoulCare',
          ...(activeRole ? { role: activeRole } : {}),
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 3. User profile subscription
  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (profile) => {
      setUserProfile(profile);
      if (profile?.role) {
        try {
          localStorage.setItem('soulcare_user_role', profile.role);
        } catch {
          // ignore
        }
      }
    });
    return () => unsubProfile();
  }, [user]);

  const signInWithGoogle = async (role?: UserRole): Promise<User | null> => {
    setLoading(true);
    try {
      if (role) {
        try {
          localStorage.setItem('soulcare_user_role', role);
        } catch {
          // ignore
        }
      }
      const loggedUser = await firebaseGoogleSignIn();
      if (loggedUser) {
        const finalRole = role || (localStorage.getItem('soulcare_user_role') as UserRole) || 'user';
        await syncUserProfile({
          userId: loggedUser.uid,
          email: loggedUser.email || '',
          name: loggedUser.displayName || loggedUser.email?.split('@')[0] || 'Người dùng SoulCare',
          role: finalRole,
        });
      }
      setIsAuthModalOpen(false);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string, role?: UserRole): Promise<User | null> => {
    setLoading(true);
    try {
      if (role) {
        try {
          localStorage.setItem('soulcare_user_role', role);
        } catch {
          // ignore
        }
      }
      const loggedUser = await firebaseEmailSignIn(email, pass);
      if (loggedUser) {
        const finalRole = role || (localStorage.getItem('soulcare_user_role') as UserRole) || 'user';
        await syncUserProfile({
          userId: loggedUser.uid,
          email: loggedUser.email || '',
          name: loggedUser.displayName || loggedUser.email?.split('@')[0] || 'Người dùng SoulCare',
          role: finalRole,
        });
      }
      setIsAuthModalOpen(false);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role?: UserRole
  ): Promise<User | null> => {
    setLoading(true);
    try {
      if (role) {
        try {
          localStorage.setItem('soulcare_user_role', role);
        } catch {
          // ignore
        }
      }
      const loggedUser = await firebaseEmailRegister(email, pass, displayName);
      if (loggedUser) {
        const finalRole = role || (localStorage.getItem('soulcare_user_role') as UserRole) || 'user';
        await syncUserProfile({
          userId: loggedUser.uid,
          email: loggedUser.email || '',
          name: displayName || 'Người dùng SoulCare',
          role: finalRole,
        });
      }
      setIsAuthModalOpen(false);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async (): Promise<void> => {
    await firebaseLogOut();
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfileDoc>): Promise<void> => {
    if (!user) return;
    await syncUserProfile({
      userId: user.uid,
      email: user.email || '',
      name: updates.name || user.displayName || user.email?.split('@')[0] || 'Người dùng SoulCare',
      ...updates,
    });
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isFirebaseReady,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        logOut,
        updateUserProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

