export declare function useLocalStorage<T>(key: string, initialValue: T): readonly [T, (value: T | ((prev: T) => T)) => void, () => void];
