import { type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { AuthContext } from "@/auth/context";
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Export the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery<{ isAdmin: boolean }, Error>({
    queryKey: ["auth", "status"],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/auth/status`, { credentials: "include" }).then((res) => {
        if (!res.ok) throw new Error("Could not fetch auth status");
        return res.json();
      }),
    retry: false,
    initialData: { isAdmin: false },
  });

  const loginMutation = useMutation<void, Error, string>({
    mutationFn: (password) =>
      fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password }),
      }).then((res) => {
        console.log(res);
        if (!res.ok) throw new Error("Invalid password");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "status"] });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: () =>
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Logout failed");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "status"] });
    },
  });

  const login = (password: string) => loginMutation.mutateAsync(password);
  const logout = () => logoutMutation.mutateAsync();

  return <AuthContext.Provider value={{ isAdmin: data.isAdmin, login, logout }}>{children}</AuthContext.Provider>;
}
