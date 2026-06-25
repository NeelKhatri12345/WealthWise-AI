import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function RegisterPage() {
  useDocumentTitle("Register");

  return (
    <div className="animate-fade-in-up">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Create Account</h1>
      <p className="mb-6 text-center text-sm text-wealth-muted">
        Start your financial wellness journey
      </p>
      <div className="card">
        <p className="text-center text-sm text-wealth-muted">Registration form placeholder</p>
      </div>
    </div>
  );
}
