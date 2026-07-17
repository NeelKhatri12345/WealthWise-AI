import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Unauthorized() {
  useDocumentTitle("Unauthorized");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-wealth-bg p-4 text-center">
      <h1 className="text-8xl font-bold text-wealth-warning">403</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">
        Access Denied
      </h2>
      <p className="mt-2 max-w-md text-wealth-muted">
        You do not have permission to access this page. Contact your
        administrator if you believe this is an error.
      </p>
      <Link to={ROUTES.DASHBOARD} className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
