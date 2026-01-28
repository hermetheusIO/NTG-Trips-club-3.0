import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AuthState {
  authenticated: boolean;
  admin?: {
    id: number;
    email: string;
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: auth, isLoading } = useQuery<AuthState>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], { authenticated: false });
      setLocation("/admin/login");
    },
  });

  return {
    isAuthenticated: auth?.authenticated ?? false,
    admin: auth?.admin,
    isLoading,
    logout: () => logoutMutation.mutate(),
  };
}
