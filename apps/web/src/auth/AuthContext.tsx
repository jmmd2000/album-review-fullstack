import { useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/auth/context";
import { ignoreThisBrowser } from "@/lib/analytics";
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: () => handleVoid(client.api.auth.logout.$post()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.status });
    },
  });

  const isAdmin = data?.isAdmin ?? false;

  // The setting stays after a logout, so the admin's own visits never count as visitors
  useEffect(() => {
    if (isAdmin) ignoreThisBrowser();
  }, [isAdmin]);

  const login = (password: string) => loginMutation.mutateAsync(password);
  const logout = () => logoutMutation.mutateAsync();

  return <AuthContext.Provider value={{ isAdmin, isPending, login, logout }}>{children}</AuthContext.Provider>;
}
