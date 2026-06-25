import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page Not Found");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-wealth-bg p-4 text-center">
      <h1 className="text-8xl font-bold text-primary-500">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
      <p className="mt-2 max-w-md text-wealth-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={ROUTES.DASHBOARD} className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
