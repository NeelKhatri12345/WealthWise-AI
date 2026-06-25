import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function LoginPage() {
  useDocumentTitle("Login");

  return (
    <div className="animate-fade-in-up">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Welcome Back</h1>
      <p className="mb-6 text-center text-sm text-wealth-muted">
        Sign in to your WealthWise account
      </p>
      {/* Login form will be implemented here */}
      <div className="card">
        <p className="text-center text-sm text-wealth-muted">Login form placeholder</p>
      </div>
    </div>
  );
}
