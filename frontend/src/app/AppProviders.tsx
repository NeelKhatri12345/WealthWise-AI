import type { ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";

import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
