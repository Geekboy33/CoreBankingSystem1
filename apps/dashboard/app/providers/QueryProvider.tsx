'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, refetchOnWindowFocus: false, retry: 1 } }
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
