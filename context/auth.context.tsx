import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { UserProfile } from "../models/userProfile";
import { User } from "@firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { queryClient } from "../utils/query.client";
import useNotificationStore from "../store/useNotificationStore";
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ needsVerification: boolean }>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  profileLoading: false,
  login: () => Promise.resolve({ needsVerification: false }),
  logout: () => Promise.resolve(),
  sendVerificationEmail: () => Promise.resolve(),
  refreshUserProfile: () => Promise.resolve(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const notificationStore = useNotificationStore();
  const refreshUserProfile = async () => {
    if (user) {
      setProfileLoading(true); // Start loading
      const userDoc = await getDoc(doc(db, "users", user.uid));
      setUserProfile(userDoc.exists() ? (userDoc.data() as UserProfile) : null);
      setProfileLoading(false); // Finished loading
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        setProfileLoading(true);
        await refreshUserProfile();
      } else {
        setProfileLoading(false);
        setUserProfile(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        await userCredential.user.reload();
        const updatedUser = auth.currentUser;
        setUser(updatedUser);
        return {
          needsVerification: updatedUser ? !updatedUser.emailVerified : false,
        };
      }
      return { needsVerification: false };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUserProfile(null); // Clear profile on logout
    setUser(null);
    await queryClient.resetQueries();
    await queryClient.invalidateQueries();
    notificationStore.clearNotifications();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        profileLoading,
        login,
        logout,
        sendVerificationEmail,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
