import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/routes/routes";

const navItems = [
  { label: "Dashboard", path: ROUTES.DASHBOARD },
  { label: "Upload", path: ROUTES.UPLOAD },
  // { label: "Transactions", path: ROUTES.TRANSACTIONS },
  { label: "Health Score", path: ROUTES.HEALTH_SCORE },
  { label: "Risk Profile", path: ROUTES.RISK_PROFILE },
  // { label: "Portfolio", path: ROUTES.PORTFOLIO },
  { label: "AI Coach", path: ROUTES.AI_COACH },
  // { label: "Reports", path: ROUTES.REPORTS },
  // { label: "Notifications", path: ROUTES.NOTIFICATIONS },
  { label: "Profile", path: ROUTES.PROFILE },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-wealth-border bg-wealth-card">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-primary-600">WealthWise</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-wealth-muted hover:bg-gray-50 hover:text-gray-900",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
