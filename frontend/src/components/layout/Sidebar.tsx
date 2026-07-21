import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/routes/routes";

const navItems = [
  { label: "Dashboard", path: ROUTES.DASHBOARD },
  { label: "Upload", path: ROUTES.UPLOAD },
  { label: "Financial Profile", path: ROUTES.FINANCIAL_PROFILE },
  { label: "Health Score", path: ROUTES.HEALTH_SCORE },
  { label: "Investment Plan", path: ROUTES.INVESTMENT_PLAN },
  { label: "Ask AI", path: ROUTES.AI_COACH },
  { label: "Profile", path: ROUTES.PROFILE },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-wealth-border bg-wealth-card">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-gray-900 tracking-tight">WealthWise AI</span>
      </div>
      <div className="flex flex-1 flex-col">
        <nav className="space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "block rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-gray-100 px-6 py-6">
          <div className="text-xs text-gray-400 space-y-1">
            <p>Version 1.0</p>
            <p>&copy; 2026 WealthWise AI</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
