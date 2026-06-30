export declare const storage: {
  readonly get: <T>(key: string) => T | null;
  readonly set: <T>(key: string, value: T) => void;
  readonly remove: (key: string) => void;
  readonly clear: () => void;
};
export declare const sessionStore: {
  readonly get: <T>(key: string) => T | null;
  readonly set: <T>(key: string, value: T) => void;
  readonly remove: (key: string) => void;
};
export {};
