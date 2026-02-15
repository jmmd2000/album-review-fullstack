import { type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { AuthContext } from "@/auth/context";
import { api } from "@/lib/api";

// Export the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useQuery<{ isAdmin: boolean }, Error>({
    queryKey: ["auth", "status"],
    queryFn: () => api.get<{ isAdmin: boolean }>("/api/auth/status"),
    retry: false,
  });

  const loginMutation = useMutation<void, Error, string>({
    mutationFn: password => api.post("/api/auth/login", { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "status"] });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "status"] });
    },
  });

  const login = (password: string) => loginMutation.mutateAsync(password);
  const logout = () => logoutMutation.mutateAsync();

  return (
    <AuthContext.Provider value={{ isAdmin: data?.isAdmin ?? false, isPending, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
