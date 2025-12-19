import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initGoogleSignin } from "../auth/google";
import { restoreSession } from "../auth/session";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { loginWithGoogleIdToken } from "../auth/login";
import { client, deleteAuthToken } from "../api/client";

type User = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

type AuthContextData = {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialize = async () => {
      initGoogleSignin();
      const session = await restoreSession();
      if (session.ok) {
        setUser(session.me);
      }
      setIsLoading(false);
    }
    initialize();
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error("No ID Token from Google");
      }

      await loginWithGoogleIdToken(idToken);

      const me = await client.get("/api/me");
      setUser(me.data);
    } catch (error) {
      console.error("Sign in failed", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await deleteAuthToken();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);