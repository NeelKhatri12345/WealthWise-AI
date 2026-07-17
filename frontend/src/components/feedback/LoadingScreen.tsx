import { Spinner } from "@/components/ui/Spinner";

export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-wealth-bg">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-wealth-muted">Loading...</p>
      </div>
    </div>
  );
}
