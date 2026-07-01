import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";

interface AccountInfoCardProps {
  userId: string;
  memberSince: string;
  isVerified: boolean;
  isActive: boolean;
}

export const AccountInfoCard = ({
  userId,
  memberSince,
  isVerified,
  isActive,
}: AccountInfoCardProps) => {
  return (
    <Card className="h-full border border-wealth-border bg-wealth-card shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Account Information</CardTitle>
        <CardDescription>System metadata and statuses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted">
            Account ID
          </span>
          <p className="mt-1 font-mono text-xs text-gray-500 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
            {userId}
          </p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted">
            Member Since
          </span>
          <p className="mt-1 text-sm font-medium text-gray-900">{memberSince}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted mb-1.5">
              Verification Status
            </span>
            <Badge variant={isVerified ? "success" : "warning"}>
              {isVerified ? "Verified" : "Pending Verification"}
            </Badge>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted mb-1.5">
              Account Status
            </span>
            <Badge variant={isActive ? "success" : "danger"}>
              {isActive ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
