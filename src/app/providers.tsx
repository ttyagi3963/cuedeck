"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LayoutProvider } from "@/context/LayoutContext";
import { ToastProvider } from "@/hooks/useToast";
import ToastContainer from "@/app/_components/ui/Toast";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <LayoutProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </QueryClientProvider>
    </LayoutProvider>
  );
}
