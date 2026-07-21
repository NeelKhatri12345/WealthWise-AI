import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/Button";

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" className="fill-primary-600" />
      <path
        d="M12 28V18l8-6 8 6v10a2 2 0 01-2 2H14a2 2 0 01-2-2z"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 30v-8h4v8"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage() {
  useDocumentTitle("WealthWise AI — Your Financial Intelligence Platform");

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"dashboard" | "transactions" | "upload">("dashboard");

  // Smooth scroll handler
  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const faqItems = [
    {
      q: "How does the AI statement parsing work?",
      a: "We use Docling, a state-of-the-art document processing engine, to extract transaction tables from PDF bank statements with extreme precision, parsing columns such as dates, descriptions, deposits, and withdrawals without manual entry.",
    },
    {
      q: "Which banks are supported by the parser?",
      a: "The extraction logic is bank-agnostic. It successfully processes both ICICI/HDFC-style (single Transaction Amount/Type) and Axis/SBI-style (separate Debit/Credit columns) statement formats.",
    },
    {
      q: "Is my personal financial data secure?",
      a: "Yes. WealthWise AI is designed with Privacy First principles. All statements are parsed and processed securely on our server. Data is stored in a secure Postgres database accessible only to your authenticated session.",
    },
    {
      q: "Can I edit transactions if the parser misses a detail?",
      a: "Absolutely. Our smart transactions manager allows you to search, filter by category/type, paginate, edit single fields (such as category or amount), and delete individual records easily.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-primary-500 selection:text-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <BrandIcon className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              WealthWise AI
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleScroll("features")}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => handleScroll("how-it-works")}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => handleScroll("why-us")}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => handleScroll("faq")}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
              Now Live: Bank-Agnostic Statement Extraction
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl leading-[1.15]">
              Your AI-Powered Personal{" "}
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                Financial Intelligence
              </span>{" "}
              Platform
            </h1>
            <p className="max-w-2xl mx-auto lg:mx-0 text-lg text-gray-600 leading-relaxed">
              Take complete control of your finances. Securely upload bank statements,
              automatically extract transaction data with Docling AI, manage records
              dynamically, and analyze spending behavior through interactive dashboards.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Right SVG Graphic illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md h-80 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 border border-primary-200 flex items-center justify-center p-6 shadow-sm overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent" />
              <svg className="w-48 h-48 text-primary-600/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              {/* Floating badges */}
              <div className="absolute top-8 left-8 rounded-lg bg-white p-3 shadow-md border border-gray-100 flex items-center gap-2">
                <span className="text-wealth-success text-xs font-semibold">💳 AI Parsed</span>
              </div>
              <div className="absolute bottom-8 right-8 rounded-lg bg-white p-3 shadow-md border border-gray-100 flex items-center gap-2">
                <span className="text-primary-600 text-xs font-semibold">📊 100% Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Preview Section ── */}
      <section id="preview" className="py-16 bg-slate-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Product Preview
            </h2>
            <p className="text-gray-600 text-sm">
              Showcasing mock sections of the real product dashboards and transaction interfaces.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActivePreviewTab("dashboard")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                activePreviewTab === "dashboard"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePreviewTab("transactions")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                activePreviewTab === "transactions"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActivePreviewTab("upload")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                activePreviewTab === "upload"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Upload Statement
            </button>
          </div>

          {/* Interactive Mockups Container */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md overflow-hidden">
            {activePreviewTab === "dashboard" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Financial Overview</h3>
                  <span className="text-xs text-wealth-muted font-medium">Aggregated Summary</span>
                </div>
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm">
                    <span className="text-xs font-semibold text-wealth-muted">Total Income</span>
                    <h4 className="text-2xl font-bold text-gray-900 mt-1">₹1,45,200</h4>
                    <span className="text-[10px] text-wealth-success mt-1 block font-medium">▲ Credit transactions</span>
                  </div>
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm">
                    <span className="text-xs font-semibold text-wealth-muted">Total Expenses</span>
                    <h4 className="text-2xl font-bold text-gray-900 mt-1">₹84,350</h4>
                    <span className="text-[10px] text-wealth-danger mt-1 block font-medium">▼ Debit transactions</span>
                  </div>
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm bg-gradient-to-br from-primary-50 to-indigo-50">
                    <span className="text-xs font-semibold text-primary-700">Calculated Net Balance</span>
                    <h4 className="text-2xl font-bold text-primary-900 mt-1">₹60,850</h4>
                    <span className="text-[10px] text-primary-600 mt-1 block font-medium">Income minus expenses</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "transactions" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Transactions List</h3>
                  <div className="flex gap-2">
                    <input
                      disabled
                      placeholder="Search SWIGGY, Salary, etc..."
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs bg-slate-50"
                    />
                  </div>
                </div>
                {/* Table Mockup */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700 border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-xs font-semibold text-gray-600">
                        <th className="p-3">Value Date</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3 text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 text-xs text-wealth-muted">12-Jun-2024</td>
                        <td className="p-3 font-medium text-gray-900">UPI-SWIGGY-REST</td>
                        <td className="p-3"><span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">Food & Dining</span></td>
                        <td className="p-3 font-semibold text-gray-900">₹450.00</td>
                        <td className="p-3 text-right"><span className="text-wealth-danger font-semibold">DEBIT</span></td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 text-xs text-wealth-muted">10-Jun-2024</td>
                        <td className="p-3 font-medium text-gray-900">SALARY-ACME-CORP</td>
                        <td className="p-3"><span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700">Income</span></td>
                        <td className="p-3 font-semibold text-gray-900">₹75,000.00</td>
                        <td className="p-3 text-right"><span className="text-wealth-success font-semibold">CREDIT</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePreviewTab === "upload" && (
              <div className="space-y-6 animate-fade-in py-4">
                <div className="max-w-xl mx-auto border-2 border-dashed border-primary-300 rounded-xl p-8 bg-slate-50 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Drag & Drop Bank Statement PDF</p>
                    <p className="text-xs text-wealth-muted mt-1">Supports HDFC, ICICI, SBI, Axis Bank (Max 10MB)</p>
                  </div>
                  <Button size="sm">Browse Files</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Implemented Features Grid ── */}
      <section id="features" className="py-16 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
              Available Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Fully Implemented Core Modules
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features configured and running on local architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-4 block">Secure Statement Upload</span>
              <p className="text-sm text-gray-600">
                Drag-and-drop your bank statement PDFs. Supports multi-page statement uploads with file size limit validation.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-4 block">AI Document Processing (Docling)</span>
              <p className="text-sm text-gray-600">
                Utilizes the state-of-the-art Docling layout analysis models to read statement PDFs, detect headers, tables, and boundary cells.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-4 block">Automatic Transaction Extraction</span>
              <p className="text-sm text-gray-600">
                Smart mapping algorithms parse values into standardized fields: dates, descriptions, balances, and separate debit/credit values.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-4 block">Smart Transaction Management</span>
              <p className="text-sm text-gray-600">
                Complete database tracking: search transactions by name, filter by category/type, modify values, and paginate seamlessly.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-4 block">Financial Dashboard</span>
              <p className="text-sm text-gray-600">
                Get an aggregated snapshot of your total incomes (credits), total expenses (debits), and net balances across all-time uploaded records.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-4 block">Privacy & Security</span>
              <p className="text-sm text-gray-600">
                Privacy-first framework. All statement extractions are processed locally under authenticated user session tables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coming Soon Section ── */}
      <section className="py-16 bg-slate-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
              Coming Soon
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Future Roadmap
            </h2>
            <p className="text-lg text-gray-600">
              We are actively developing premium advanced analysis features.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Soon 1 */}
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 opacity-80">
              <span className="text-2xl mb-3 block">🩺</span>
              <h3 className="font-bold text-gray-900 mb-1">Financial Health Score</h3>
              <p className="text-xs text-gray-600">
                Understand your creditworthiness, debt ratio, and overall savings rates in one calculated score.
              </p>
            </div>
            {/* Soon 2 */}
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 opacity-80">
              <span className="text-2xl mb-3 block">💬</span>
              <h3 className="font-bold text-gray-900 mb-1">Ask AI</h3>
              <p className="text-xs text-gray-600">
                Interact with a specialized finance assistant trained on your transaction lists to optimize budgeting.
              </p>
            </div>
            {/* Soon 3 */}
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 opacity-80">
              <span className="text-2xl mb-3 block">🎯</span>
              <h3 className="font-bold text-gray-900 mb-1">Risk Profile</h3>
              <p className="text-xs text-gray-600">
                Complete interactive questionnaire structures to assess investment tolerance indexes.
              </p>
            </div>
            {/* Soon 4 */}
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 opacity-80">
              <span className="text-2xl mb-3 block">📈</span>
              <h3 className="font-bold text-gray-900 mb-1">Portfolio Tracking</h3>
              <p className="text-xs text-gray-600">
                Track external investment schemes, mutual funds, and stock portfolios in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-16 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Go from raw statement PDFs to actionable database tables in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 relative">
            {/* Connected step line (desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-200 via-indigo-200 to-primary-200 -z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center text-lg font-bold text-primary-700 shadow-inner">
                1
              </div>
              <h3 className="font-bold text-gray-900">Upload Statement</h3>
              <p className="text-xs text-gray-600">Drag and drop bank statement PDFs securely.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center text-lg font-bold text-primary-700 shadow-inner">
                2
              </div>
              <h3 className="font-bold text-gray-900">AI extracts transactions</h3>
              <p className="text-xs text-gray-600">Docling layout models parse columns with high precision.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center text-lg font-bold text-primary-700 shadow-inner">
                3
              </div>
              <h3 className="font-bold text-gray-900">Financial analysis</h3>
              <p className="text-xs text-gray-600">Transactions are mapped to credit/debit aggregates.</p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center text-lg font-bold text-primary-700 shadow-inner">
                4
              </div>
              <h3 className="font-bold text-gray-900">Personalized insights</h3>
              <p className="text-xs text-gray-600">Filter, edit, or delete transactions dynamically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why WealthWise AI Section ── */}
      <section id="why-us" className="py-16 bg-slate-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why WealthWise AI?
            </h2>
            <p className="text-lg text-gray-600">
              Modern financial tracking built for speed, transparency, and data ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">AI Powered</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Eliminate tedious CSV configuration. Docling AI maps diverse bank layout schemas automatically.
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Privacy First</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your statements are parsed in your dedicated account space. We never sell your personal details.
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <span className="text-2xl">🏃</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Fast Processing</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Upload multiple bank statements and receive mapped records on your dashboard instantly.
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <span className="text-2xl">🚫</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">No Manual Expense Tracking</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Stop writing down Swiggy or Amazon receipts. Sync your official bank statements for perfect accuracy.
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Secure Storage</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your transactions are safely normalized and indexed inside a production-grade SQL relational database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-16 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-sm">
              Common queries regarding statements, parsing, and security.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-slate-50 animate-fade-in">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{item.q}</span>
                  <span className="text-lg text-primary-500">{activeFaq === idx ? "−" : "+"}</span>
                </button>
                {activeFaq === idx && (
                  <div className="p-5 border-t border-gray-200 bg-white text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-primary-500" viewBox="0 0 40 40" fill="currentColor">
                <rect width="40" height="40" rx="10" />
                <path d="M12 28V18l8-6 8 6v10a2 2 0 01-2 2H14a2 2 0 01-2-2z" fill="white" />
              </svg>
              <span className="text-white text-lg font-bold">WealthWise AI</span>
            </div>
            <p className="text-xs text-slate-400">
              AI-driven insights, statement uploads, and personal finance intelligence.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Platform</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => handleScroll("features")} className="hover:text-white cursor-pointer">Features</button></li>
              <li><button onClick={() => handleScroll("how-it-works")} className="hover:text-white cursor-pointer">How It Works</button></li>
              <li><button onClick={() => handleScroll("why-us")} className="hover:text-white cursor-pointer">About Us</button></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Legal</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="#" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Contact</h5>
            <p className="text-xs text-slate-400 font-medium">
              support@wealthwise.ai<br />
              Bengaluru, Karnataka, India
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} WealthWise AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-white">Privacy Policy</Link>
            <Link to="#" className="hover:text-white">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
