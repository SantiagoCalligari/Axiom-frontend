// context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  token: string | null;
  login: (newToken: string) => void;
  logout: () => void;
  isLoading: boolean; // To track initial token load
}

// Create context with a default value (can be undefined initially)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading

  // Load token from localStorage on initial mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("axiom_access_token");
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      // Handle cases where localStorage is disabled or inaccessible
    } finally {
      setIsLoading(false); // Finished loading attempt
    }
  }, []);

  const login = (newToken: string) => {
    try {
      localStorage.setItem("axiom_access_token", newToken);
      setToken(newToken);
    } catch (error) {
      console.error("Failed to save token to localStorage:", error);
      // Optionally show an error to the user
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("axiom_access_token");
      setToken(null);
    } catch (error) {
      console.error("Failed to remove token from localStorage:", error);
    }
  };

  // Don't render children until loading is complete to avoid flicker
  if (isLoading) {
    return null; // Or return a loading spinner/skeleton screen
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

