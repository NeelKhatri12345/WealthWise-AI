interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUrl?: string;
  memberSince?: string;
}

export const ProfileHeader = ({
  name,
  email,
  avatarUrl,
  memberSince,
}: ProfileHeaderProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-6 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
          {initials}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900">{name}</h2>
        <p className="text-sm text-gray-500">{email}</p>
        {memberSince && (
          <p className="mt-1 text-xs text-gray-400">
            Member since {memberSince}
          </p>
        )}
      </div>
    </div>
  );
};
