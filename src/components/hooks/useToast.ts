import { useState, useCallback } from "react";
import type { Toast } from "@/components/ui/toast";

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: "error" });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
  };
}
