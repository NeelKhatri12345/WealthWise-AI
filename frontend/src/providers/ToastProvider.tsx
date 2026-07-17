import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#ffffff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
          },
        }}
      />
    </>
  );
}
