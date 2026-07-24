import { type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/auth/context";
import { client, handle, handleVoid } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";

// Export the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.auth.status,
    queryFn: () => handle(client.api.auth.status.$get()),
    retry: false,
  });

  const loginMutation = useMutation<void, Error, string>({
    mutationFn: password => handleVoid(client.api.auth.login.$post({ json: { password } })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: () => handleVoid(client.api.auth.logout.$post()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
    },
  });

  const login = (password: string) => loginMutation.mutateAsync(password);
  const logout = () => logoutMutation.mutateAsync();

  return <AuthContext.Provider value={{ isAdmin: data?.isAdmin ?? false, isPending, login, logout }}>{children}</AuthContext.Provider>;
}
