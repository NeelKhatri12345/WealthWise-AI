import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";

export function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-wealth-border bg-wealth-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">WealthWise AI</h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-wealth-muted hover:bg-gray-100"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
        </button>
        <Avatar
          name={user ? `${user.firstName} ${user.lastName}` : undefined}
          size="sm"
        />
      </div>
    </header>
  );
}
