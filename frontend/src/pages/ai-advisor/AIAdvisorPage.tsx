import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { aiAdvisorApi, type AIAdvisorAdviceResponse } from "@/services/api/aiAdvisor.api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "react-hot-toast";

interface ChatTurn {
  id: string;
  question: string;
  advice: AIAdvisorAdviceResponse | null;
  loading: boolean;
  error: string | null;
}

const SUGGESTED_QUESTIONS = [
  "Explain my financial health.",
  "Why is my health score low?",
  "Why was this investment recommended?",
  "How can I improve my score?",
  "What happens if I increase my monthly investment?",
  "What are my biggest financial risks?",
  "Is my emergency fund sufficient?",
  "How can I become an aggressive investor?",
  "What should I improve first?",
];

export default function AIAdvisorPage() {
  useDocumentTitle("AI Financial Advisor");

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on turns modification
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const handleQuery = async (questionText: string) => {
    if (!questionText.trim()) return;

    const turnId = Math.random().toString(36).substring(7);
    const newTurn: ChatTurn = {
      id: turnId,
      question: questionText,
      advice: null,
      loading: true,
      error: null,
    };

    setTurns((prev) => [...prev, newTurn]);
    setInputText("");

    try {
      const response = await aiAdvisorApi.query(questionText);
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, advice: response, loading: false } : t))
      );
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "An unexpected advisory request failure occurred.";
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, error: errorMsg, loading: false } : t))
      );
      toast.error("Advice query failed.");
    }
  };

  const handleRegenerate = (questionText: string, turnId: string) => {
    // Remove the old turn and trigger again
    setTurns((prev) => prev.filter((t) => t.id !== turnId));
    handleQuery(questionText);
  };

  const handleCopy = (advice: AIAdvisorAdviceResponse) => {
    const textToCopy = `
=== FINANCIAL ADVICE SNAPSHOT ===

Financial Summary:
${advice.financial_summary}

Current Strengths:
${advice.current_strengths.map((s) => `• ${s}`).join("\n")}

Potential Risks:
${advice.potential_risks.map((r) => `• ${r}`).join("\n")}

Investment Insights:
${advice.investment_insights}

Recommended Next Steps:
${advice.recommended_next_steps.map((n) => `• ${n}`).join("\n")}

Long-Term Opportunities:
${advice.long_term_opportunities}

Important Considerations:
${advice.important_considerations}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    toast.success("Advice copied to clipboard!");
  };

  return (
    <div className="flex h-full flex-col space-y-6 overflow-hidden">
      <PageHeader
        title="AI Financial Advisor"
        description="Grounded, personalized explanations of your deterministic scores and investment recommended allocations."
      />

      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 rounded-3xl border border-slate-100 relative">
        {/* Clear Conversation action top bar */}
        {turns.length > 0 && (
          <div className="p-3 border-b border-slate-100 bg-white flex justify-end flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTurns([])}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Clear Conversation History
            </Button>
          </div>
        )}

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {turns.length === 0 ? (
            <div className="max-w-3xl mx-auto space-y-8 py-8 animate-in fade-in duration-300">
              <Card className="p-6 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-slate-100/80 shadow-sm rounded-3xl text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  ⚡
                </div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-base font-bold text-slate-800">Ask your AI Advisor</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select a suggested question below or input a custom prompt. Gemini will interpret your calculations and suggest adjustments in natural language.
                  </p>
                </div>
              </Card>

              {/* Suggestions Grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Suggested Queries
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuery(q)}
                      className="p-3 text-left text-xs font-medium text-slate-600 bg-white border border-slate-100 hover:border-indigo-100 hover:text-indigo-600 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 leading-normal"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {turns.map((turn) => (
                <div key={turn.id} className="space-y-4">
                  {/* User query bubble */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-3xl px-4 py-2.5 text-xs font-bold shadow-md max-w-lg leading-relaxed">
                      {turn.question}
                    </div>
                  </div>

                  {/* AI Response Card */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 max-w-3xl w-full space-y-6 relative overflow-hidden">
                      {turn.loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <Spinner size="lg" />
                          <p className="text-xs text-slate-400">Genuinely parsing financial facts…</p>
                        </div>
                      )}

                      {turn.error && (
                        <div className="text-center py-6 space-y-3">
                          <p className="text-xs text-rose-600 bg-rose-50 rounded-xl p-3 border border-rose-100">
                            {turn.error}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleRegenerate(turn.question, turn.id)}
                            className="text-xs"
                          >
                            Regenerate
                          </Button>
                        </div>
                      )}

                      {turn.advice && (
                        <div className="space-y-6">
                          {/* Financial Summary */}
                          <div className="border-l-4 border-indigo-500 pl-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Financial Summary</h4>
                            <div className="text-sm font-semibold text-slate-800 mt-1 leading-relaxed prose prose-sm">
                              <ReactMarkdown>{turn.advice.financial_summary}</ReactMarkdown>
                            </div>
                          </div>

                          {/* Bullet blocks grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-4 space-y-2">
                              <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Strengths</h5>
                              <ul className="space-y-1.5">
                                {turn.advice.current_strengths.map((s, idx) => (
                                  <li key={idx} className="text-xs text-emerald-900 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">✓</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Risks */}
                            <div className="bg-rose-50/20 border border-rose-100/50 rounded-2xl p-4 space-y-2">
                              <h5 className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Risks & Vulnerabilities</h5>
                              <ul className="space-y-1.5">
                                {turn.advice.potential_risks.map((r, idx) => (
                                  <li key={idx} className="text-xs text-rose-950 flex items-start gap-2">
                                    <span className="text-rose-500 mt-0.5">⚠️</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Investment Insights */}
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investment Strategy Insights</h4>
                            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100/50 prose prose-sm">
                              <ReactMarkdown>{turn.advice.investment_insights}</ReactMarkdown>
                            </div>
                          </div>

                          {/* Next steps checklist */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actionable Next Steps</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {turn.advice.recommended_next_steps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50 text-xs text-indigo-950">
                                  <span className="h-5 w-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-extrabold text-indigo-700 flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Opportunities */}
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Long-Term Wealth Horizon</h4>
                            <div className="text-xs text-slate-700 leading-relaxed prose prose-sm">
                              <ReactMarkdown>{turn.advice.long_term_opportunities}</ReactMarkdown>
                            </div>
                          </div>

                          {/* Important Disclaimers */}
                          <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200/50 text-[10px] text-slate-400 leading-relaxed prose prose-sm">
                            <ReactMarkdown>{turn.advice.important_considerations}</ReactMarkdown>
                          </div>

                          {/* Turn Toolbar */}
                          <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(turn.advice!)}
                              className="text-xs font-bold py-1 px-3"
                            >
                              Copy Advice
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate(turn.question, turn.id)}
                              className="text-xs font-bold py-1 px-3"
                            >
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Floating Input Area footer */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(inputText);
            }}
            className="max-w-4xl mx-auto flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask: 'Is my emergency fund sufficient?' or 'What happens if I increase my investments?'"
              className="flex-1 rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-xs py-2.5"
            />
            <Button type="submit" className="rounded-2xl px-5 py-2.5 text-xs font-bold">
              Submit Query
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
