import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/routes/routes";

const adminNavItems = [
  { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD },
  { label: "Users", path: ROUTES.ADMIN_USERS },
];

export function AdminNav() {
  return (
    <aside className="flex w-64 flex-col border-r border-wealth-border bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-white">Admin Panel</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white",
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
