import { type RefObject } from "react";
export declare function useClickOutside<T extends HTMLElement>(handler: () => void): RefObject<T | null>;
