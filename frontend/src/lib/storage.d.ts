declare function get<T>(key: string): T | null;
declare function set<T>(key: string, value: T): void;
declare function remove(key: string): void;
declare function clear(): void;
export declare const storage: {
    readonly get: typeof get;
    readonly set: typeof set;
    readonly remove: typeof remove;
    readonly clear: typeof clear;
};
declare function sessionGet<T>(key: string): T | null;
declare function sessionSet<T>(key: string, value: T): void;
declare function sessionRemove(key: string): void;
export declare const sessionStore: {
    readonly get: typeof sessionGet;
    readonly set: typeof sessionSet;
    readonly remove: typeof sessionRemove;
};
export {};
