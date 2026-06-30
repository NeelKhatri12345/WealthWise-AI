import { useEffect, useRef, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchCurrentUser, setHydrated } from "@/store/slices/authSlice";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Session restoration on app startup.
 *
 * Auth state lives in Redux; this component only triggers hydration.
 * If a persisted token exists, it dispatches fetchCurrentUser to
 * validate the token and populate state.auth.user.
 * If no token exists, it marks hydration as complete immediately.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isHydrated = useAppSelector((state) => state.auth.isHydrated);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (accessToken && !isHydrated) {
      void dispatch(fetchCurrentUser());
    } else if (!accessToken) {
      dispatch(setHydrated());
    }
  }, [accessToken, isHydrated, dispatch]);

  return children;
}
