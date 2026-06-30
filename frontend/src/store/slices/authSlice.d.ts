export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
}
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
export declare const login: import("@reduxjs/toolkit").AsyncThunk<
  import("../../services/api/auth.api").AuthResponse,
  {
    email: string;
    password: string;
  },
  import("@reduxjs/toolkit").AsyncThunkConfig
>;
export declare const register: import("@reduxjs/toolkit").AsyncThunk<
  import("../../services/api/auth.api").AuthResponse,
  {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  },
  import("@reduxjs/toolkit").AsyncThunkConfig
>;
export declare const refreshTokenThunk: import("@reduxjs/toolkit").AsyncThunk<
  {
    token: string;
    refreshToken: string;
  },
  void,
  import("@reduxjs/toolkit").AsyncThunkConfig
>;
export declare const updateProfile: import("@reduxjs/toolkit").AsyncThunk<
  {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: "user" | "admin";
    createdAt: string;
  },
  Partial<Pick<User, "firstName" | "lastName" | "avatar">>,
  import("@reduxjs/toolkit").AsyncThunkConfig
>;
export declare const logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/logout">,
  clearAuthError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/clearAuthError">;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
