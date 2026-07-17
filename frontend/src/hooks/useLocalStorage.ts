import { useState, useCallback } from "react";
import { storage } from "@/lib/storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = storage.get<T>(key);
    return item ?? initialValue;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        storage.set(key, next);
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    storage.remove(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
