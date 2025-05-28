// FILE: app/context/AuthContext.tsx
"use client";
import { University, Career, Subject } from "../types";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";

// --- User Interface (based on your API response) ---
interface UserRole {
  name: string;
}

interface UniversityForUserContext {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CareerForUserContext {
  id: number;
  university_id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  university: UniversityForUserContext;
}

interface SubjectForUserContext {
  id: number;
  career_id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  pivot: {
    user_id: number;
    subject_id: number;
  };
  career: CareerForUserContext;
}

export interface User {
  id: number;
  name: string;
  email: string;
  admin_universities?: University[];
  admin_careers?: Career[];
  admin_subjects?: Subject[];
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
  subjects: SubjectForUserContext[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
  verifyTokenAndExecute: (
    action: () => Promise<void> | void,
    showLoginModalOnFail?: boolean,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchUser = useCallback(
    async (currentToken: string): Promise<User | null> => {
      if (!API_URL) {
        console.error("API URL not configured for fetching user.");
        return null;
      }
      const userEndpoint = `${API_URL}/api/auth/user`;
      try {
        const response = await fetch(userEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid or expired
            console.warn("User fetch failed: Unauthenticated (401)");
            return null;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Error ${response.status}: Could not fetch user data.`,
          );
        }
        const result = await response.json();
        return result.data as User;
      } catch (err) {
        console.error("Error fetching user data:", err);
        // Do not toast here, let calling function decide
        return null;
      }
    },
    [API_URL],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("axiom_access_token");
    } catch (error) {
      console.error("Failed to remove token from localStorage:", error);
    }
    setToken(null);
    setUser(null);
    // toast.info("Sesión cerrada."); // Optional: can be toasted where logout is called
  }, []);

  // Effect for initial auth status check
  useEffect(() => {
    let isMounted = true;
    const checkInitialAuth = async () => {
      setIsLoading(true);
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem("axiom_access_token");
      } catch (error) {
        console.error("Failed to access localStorage:", error);
      }

      if (storedToken) {
        const fetchedUser = await fetchUser(storedToken);
        if (isMounted) {
          if (fetchedUser) {
            setToken(storedToken);
            setUser(fetchedUser);
          } else {
            // Token was invalid, clear it
            logout();
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    checkInitialAuth();
    return () => {
      isMounted = false;
    };
  }, [fetchUser, logout]);

  const login = async (newToken: string) => {
    try {
      localStorage.setItem("axiom_access_token", newToken);
    } catch (error) {
      console.error("Failed to save token to localStorage:", error);
      toast.error(
        "No se pudo guardar la sesión. Intenta de nuevo o contacta soporte.",
      );
      return; // Early exit if localStorage fails
    }

    setToken(newToken);
    setIsLoading(true); // Indicate loading user data
    const fetchedUser = await fetchUser(newToken);
    if (fetchedUser) {
      setUser(fetchedUser);
      toast.success("¡Sesión iniciada correctamente!");
      closeLoginModal();
    } else {
      // Failed to fetch user even with new token, treat as login failure
      toast.error(
        "Error al verificar la sesión. Por favor, intenta iniciar sesión de nuevo.",
      );
      logout(); // Clear the problematic token
    }
    setIsLoading(false);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const verifyTokenAndExecute = useCallback(
    async (
      action: () => Promise<void> | void,
      showLoginModalOnFail = true,
    ) => {
      if (!token) {
        if (showLoginModalOnFail) openLoginModal();
        toast.info("Debes iniciar sesión para realizar esta acción.");
        return;
      }

      // Optimistic check: if user object exists, assume token is fine for now
      // For critical actions, or if user object could be stale, always re-verify
      if (user) {
        await Promise.resolve(action());
        return;
      }

      // If no user object, or to be absolutely sure, re-fetch user
      setIsLoading(true);
      const fetchedUser = await fetchUser(token);
      setIsLoading(false);

      if (fetchedUser) {
        setUser(fetchedUser); // Update user state if it was missing
        await Promise.resolve(action());
      } else {
        logout(); // Token is invalid
        if (showLoginModalOnFail) openLoginModal();
        toast.error(
          "Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.",
        );
      }
    },
    [token, user, fetchUser, logout],
  );

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
        isLoginModalOpen,
        verifyTokenAndExecute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
