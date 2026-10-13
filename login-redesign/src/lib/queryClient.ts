import { QueryClient } from '@tanstack/react-query'

/** Shared cache. Retries network hiccups twice, never retries auth/validation. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status ?? 0
        if (status === 401 || status === 403 || status === 404 || status === 422) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: 0,
    },
  },
})
