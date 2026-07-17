function get<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`Failed to save "${key}" to localStorage`);
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn(`Failed to remove "${key}" from localStorage`);
  }
}

function clear(): void {
  try {
    localStorage.clear();
  } catch {
    console.warn("Failed to clear localStorage");
  }
}

export const storage = { get, set, remove, clear } as const;

function sessionGet<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

function sessionSet<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`Failed to save "${key}" to sessionStorage`);
  }
}

function sessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    console.warn(`Failed to remove "${key}" from sessionStorage`);
  }
}

export const sessionStore = {
  get: sessionGet,
  set: sessionSet,
  remove: sessionRemove,
} as const;
