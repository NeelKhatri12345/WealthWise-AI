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
      className="overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white"
    >
      <div className="relative px-6 py-8 sm:px-8">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative z-10">
          <p className="text-sm font-medium text-primary-200">{formatDate()}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="mt-2 max-w-lg text-sm text-primary-200 sm:text-base">
            Track your spending, monitor your finances, and improve your financial health.
          </p>
        </div>
      </div>
    </Card>
  );
}
