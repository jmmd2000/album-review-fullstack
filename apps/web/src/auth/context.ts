import { createContext } from "react";

export interface AuthContextType {
  isAdmin: boolean;
  isPending: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Context to provide auth status & login/logout functions.
 * Use the `useAuth` hook to access this context.
 */
export const AuthContext = createContext<AuthContextType | null>(null);
