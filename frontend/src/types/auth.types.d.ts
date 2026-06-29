import type { UserRole } from "@/constants/roles";
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}
export interface AuthState {
    user: User | null;
    token: Token | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
export interface Token {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export interface AuthResponse {
    user: User;
    token: Token;
}
