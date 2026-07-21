import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/Card";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DashboardHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const displayName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <Card
      padding="none"
      className="overflow-hidden bg-gradient-to-r from-indigo-50 via-blue-50 to-white border border-indigo-100 shadow-sm"
    >
      <div className="relative px-6 py-8 sm:px-8">
        {/* Subtle decorative shapes */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-indigo-100/50 blur-xl" />

        <div className="relative z-10">
          <p className="text-sm font-medium text-indigo-600 mb-1">{formatDate()}</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="mt-2 max-w-lg text-sm text-gray-600 leading-relaxed sm:text-base">
            Track your spending, monitor your finances, and improve your financial health.
          </p>
        </div>
      </div>
    </Card>
  );
}
