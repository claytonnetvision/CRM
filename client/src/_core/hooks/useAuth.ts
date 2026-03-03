import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  console.log('[useAuth] Hook called with options:', options);
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  console.log('[useAuth] Calling trpc.auth.me.useQuery');
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  console.log('[useAuth] meQuery state:', { isLoading: meQuery.isLoading, data: meQuery.data, error: meQuery.error });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    console.log('[useAuth] Computing auth state');
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    const authState = {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
    console.log('[useAuth] Auth state computed:', authState);
    return authState;
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    console.log('[useAuth] useEffect - redirect check');
    if (!redirectOnUnauthenticated) {
      console.log('[useAuth] redirectOnUnauthenticated is false, skipping');
      return;
    }
    if (meQuery.isLoading || logoutMutation.isPending) {
      console.log('[useAuth] Still loading, skipping redirect');
      return;
    }
    if (state.user) {
      console.log('[useAuth] User authenticated, no redirect needed');
      return;
    }
    if (typeof window === "undefined") {
      console.log('[useAuth] No window object, skipping redirect');
      return;
    }
    if (window.location.pathname === redirectPath) {
      console.log('[useAuth] Already on redirect path, skipping');
      return;
    }

    console.log('[useAuth] Redirecting to:', redirectPath);
    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
