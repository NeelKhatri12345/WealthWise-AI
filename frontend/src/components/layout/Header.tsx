import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { Avatar } from "@/components/ui/Avatar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ROUTES } from "@/routes/routes";
import { cn } from "@/utils/cn";

interface HeaderProps {
  visible?: boolean;
}

export function Header({ visible = true }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  useEffect(() => {
    if (!visible) setIsOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleViewProfile = () => {
    setIsOpen(false);
    navigate(ROUTES.PROFILE);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header
      className={cn(
        "absolute top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-wealth-border bg-wealth-card px-6",
        "transition-all duration-300 ease-in-out",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Empty spacing for cleaner top navigation */}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:opacity-90 transition-opacity"
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <Avatar
              src={user?.avatar}
              name={user ? `${user.firstName} ${user.lastName}` : undefined}
              size="sm"
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-wealth-border bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
              {/* User Details */}
              <div className="px-4 py-3 flex items-center gap-3">
                <Avatar
                  src={user?.avatar}
                  name={user ? `${user.firstName} ${user.lastName}` : undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user ? `${user.firstName} ${user.lastName}` : ""}
                  </p>
                  <p className="text-xs text-wealth-muted truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>

              <div className="border-t border-wealth-border" />

              {/* Menu Actions */}
              <div className="py-1">
                <button
                  onClick={handleViewProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-wealth-danger hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="h-4 w-4 text-wealth-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
