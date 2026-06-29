import { Outlet } from "react-router-dom";
import { Card } from "@/components/ui/Card";

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
// Feature highlights shown on the branding panel
// ---------------------------------------------------------------------------

const features = [
  { title: "AI-Powered Insights", description: "Smart analysis of your spending patterns" },
  { title: "Portfolio Tracking", description: "Real-time monitoring of your investments" },
  { title: "Financial Health Score", description: "Understand your financial wellness at a glance" },
] as const;

// ---------------------------------------------------------------------------
// AuthLayout
// ---------------------------------------------------------------------------

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-10 xl:p-14">
          {/* Decorative circles */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5"
            aria-hidden="true"
          />

          {/* Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <BrandIcon className="h-10 w-10" />
              <span className="text-2xl font-bold tracking-tight text-white">
                WealthWise AI
              </span>
            </div>
          </div>

          {/* Tagline + features */}
          <div className="relative z-10 space-y-8">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Your intelligent
                <br />
                financial companion
              </h1>
              <p className="mt-3 max-w-md text-base text-primary-200">
                Take control of your finances with AI-driven insights,
                smart budgeting, and personalised coaching.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-sm text-primary-200">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="relative z-10 text-xs text-primary-300">
            &copy; {new Date().getFullYear()} WealthWise AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right auth card panel ── */}
      <div className="flex w-full flex-col items-center justify-center bg-wealth-bg px-4 py-10 lg:w-1/2 xl:w-[45%]">
        {/* Mobile-only branding */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <BrandIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-gray-900">WealthWise AI</span>
        </div>

        <Card padding="lg" className="w-full max-w-md">
          <Outlet />
        </Card>
      </div>
    </div>
  );
}
