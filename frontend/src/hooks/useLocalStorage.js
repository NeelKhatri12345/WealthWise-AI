import { useState, useCallback } from "react";
import { storage } from "@/lib/storage";
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        const item = storage.get(key);
        return item ?? initialValue;
    });
    const setValue = useCallback((value) => {
        setStoredValue((prev) => {
            const next = value instanceof Function ? value(prev) : value;
            storage.set(key, next);
            return next;
        });
    }, [key]);
    const removeValue = useCallback(() => {
        storage.remove(key);
        setStoredValue(initialValue);
    }, [key, initialValue]);
    return [storedValue, setValue, removeValue];
}
