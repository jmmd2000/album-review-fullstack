import { createContext } from "react";
import { AuthContextType } from "@shared/types";

/**
 * Context to provide auth status & login/logout functions.
 * Use the `useAuth` hook to access this context.
 */
export const AuthContext = createContext<AuthContextType | null>(null);
