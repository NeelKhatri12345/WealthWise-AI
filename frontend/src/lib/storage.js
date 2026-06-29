function get(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    catch {
        return null;
    }
}
function set(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch {
        console.warn(`Failed to save "${key}" to localStorage`);
    }
}
function remove(key) {
    try {
        localStorage.removeItem(key);
    }
    catch {
        console.warn(`Failed to remove "${key}" from localStorage`);
    }
}
function clear() {
    try {
        localStorage.clear();
    }
    catch {
        console.warn("Failed to clear localStorage");
    }
}
export const storage = { get, set, remove, clear };
function sessionGet(key) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    catch {
        return null;
    }
}
function sessionSet(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    }
    catch {
        console.warn(`Failed to save "${key}" to sessionStorage`);
    }
}
function sessionRemove(key) {
    try {
        sessionStorage.removeItem(key);
    }
    catch {
        console.warn(`Failed to remove "${key}" from sessionStorage`);
    }
}
export const sessionStore = {
    get: sessionGet,
    set: sessionSet,
    remove: sessionRemove,
};
