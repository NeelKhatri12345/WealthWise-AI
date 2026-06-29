interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    memberSince: string;
    twoFactorEnabled: boolean;
}
interface UseProfileReturn {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    toggle2FA: (enabled: boolean) => Promise<void>;
    deleteAccount: () => Promise<void>;
}
export declare const useProfile: () => UseProfileReturn;
export {};
