import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";

interface PersonalInfoCardProps {
  name: string;
  email: string;
  phone?: string;
  roleName: string;
}

export const PersonalInfoCard = ({
  name,
  email,
  phone,
  roleName,
}: PersonalInfoCardProps) => {
  return (
    <Card className="h-full border border-wealth-border bg-wealth-card shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Personal Information</CardTitle>
        <CardDescription>Your personal profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted">
            Full Name
          </span>
          <p className="mt-1 text-sm font-medium text-gray-900">{name}</p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted">
            Email Address
          </span>
          <p className="mt-1 text-sm font-medium text-gray-900 break-all">{email}</p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted">
            Phone Number
          </span>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {phone || <span className="italic text-gray-400">Not provided</span>}
          </p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-wealth-muted">
            Role
          </span>
          <div className="mt-1.5">
            <Badge variant="primary" className="capitalize">
              {roleName || "User"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
