import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ServerError() {
  useDocumentTitle("Server Error");

  const handleReload = () => window.location.reload();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-wealth-bg p-4 text-center">
      <h1 className="text-8xl font-bold text-wealth-danger">500</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">Internal Server Error</h2>
      <p className="mt-2 max-w-md text-wealth-muted">
        Something went wrong on our end. Please try again later.
      </p>
      <Button onClick={handleReload} className="mt-6">
        Reload Page
      </Button>
    </div>
  );
}
