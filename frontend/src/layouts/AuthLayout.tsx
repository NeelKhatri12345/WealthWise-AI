import { Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/routes/routes";

// ---------------------------------------------------------------------------
// Branding icon (inline SVG — no external asset dependency)
// ---------------------------------------------------------------------------

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" className="fill-white/20" />
      <path
        d="M12 28V18l8-6 8 6v10a2 2 0 01-2 2H14a2 2 0 01-2-2z"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 30v-8h4v8"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AuthLayout
// ---------------------------------------------------------------------------

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname === ROUTES.REGISTER;
  const isForgot = location.pathname === ROUTES.FORGOT_PASSWORD;
  const isAdminLogin = location.pathname === ROUTES.ADMIN_LOGIN;

  const sentence = isAdminLogin
    ? "Secure administrator access to the WealthWise platform."
    : isRegister
    ? "Start your journey toward smarter financial management."
    : isForgot
      ? "Recover access to your account."
      : "Welcome back. Sign in to continue managing your finances.";

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-wealth-border bg-white shadow-xl min-h-[500px]">
        {/* ── Left branding panel (desktop only) ── */}
        <div className="hidden lg:flex lg:w-[38%] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-8 flex-col justify-between text-white relative">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-white/5" />

          {/* Logo & Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <BrandIcon className="h-9 w-9" />
              <span className="text-xl font-bold tracking-tight text-white">WealthWise AI</span>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-bold leading-tight text-white">
              {isAdminLogin
                ? "Admin Access"
                : isRegister
                  ? "Create Account"
                  : isForgot
                    ? "Forgot Password"
                    : "Welcome Back"}
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              {sentence}
            </p>
          </div>

          {/* Footer inside left panel */}
          <p className="relative z-10 text-[10px] text-primary-300">
            &copy; {new Date().getFullYear()} WealthWise AI. All rights reserved.
          </p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-[62%] sm:px-12 bg-white">
          {/* Mobile-only branding header */}
          <div className="mb-6 flex flex-col items-center gap-2 lg:hidden text-center">
            <BrandIcon className="h-10 w-10 p-2 bg-primary-600 rounded-lg text-white" />
            <span className="text-xl font-bold text-gray-900">WealthWise AI</span>
            <p className="text-xs text-wealth-muted max-w-xs">{sentence}</p>
          </div>

          <div className="w-full max-w-md mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
