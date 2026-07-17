interface WelcomeCardProps {
  userName: string;
  lastLogin?: string;
  netWorth?: number;
}

export const WelcomeCard = ({
  userName,
  lastLogin,
  netWorth,
}: WelcomeCardProps) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h2 className="text-2xl font-bold">
        {greeting()}, {userName}!
      </h2>
      <p className="mt-1 text-indigo-100">
        Here&apos;s your financial overview for today.
      </p>
      <div className="mt-4 flex items-center justify-between">
        {netWorth !== undefined && (
          <div>
            <p className="text-sm text-indigo-200">Net Worth</p>
            <p className="text-3xl font-bold">${netWorth.toLocaleString()}</p>
          </div>
        )}
        {lastLogin && (
          <p className="text-xs text-indigo-200">Last login: {lastLogin}</p>
        )}
      </div>
    </div>
  );
};
