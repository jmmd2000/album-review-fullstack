import { useContext } from "react";
import { AuthContext } from "@/auth/context";

/**
 * Hook to read auth status & call login/logout.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be inside an AuthProvider");
  }
  return ctx;
}
