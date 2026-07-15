import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  startChatSession,
  sendChatMessage,
  goToPreviousStep,
  fetchFinancialProfile,
  calculateHealthScore,
  selectFinancialProfile,
  clearChatError,
  clearValidationMessage,
} from "@/store/slices/financialProfileSlice";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/routes/routes";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10;

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ step, pct }: { step: number; pct: number }) {
  const displayStep = Math.min(step + 1, TOTAL_STEPS);
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-wealth-muted whitespace-nowrap">
        Step {displayStep} / {TOTAL_STEPS}
      </span>
      <span className="text-xs font-bold text-primary-600 whitespace-nowrap">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="flex-1 max-w-lg">
        <div className="bg-white border border-wealth-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
        <span className="text-[10px] text-wealth-muted ml-2 mt-1 block">WealthWise AI</span>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex-1 max-w-sm flex flex-col items-end">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-sm">
          <p className="text-sm leading-relaxed">{text}</p>
        </div>
        <span className="text-[10px] text-wealth-muted mr-2 mt-1 block">You</span>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="bg-white border border-wealth-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}



function NoTransactionState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8 max-w-md mx-auto">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">Upload a Statement First</h3>
      <p className="text-sm text-wealth-muted mb-8 leading-relaxed">
        To build your financial profile, we first need your transaction data. Upload and accept a bank statement, then return here.
      </p>
      <button
        onClick={() => navigate(ROUTES.UPLOAD)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload Bank Statement
      </button>
    </div>
  );
}

function CompletionCard({
  pct,
  onGenerate,
  generating,
}: {
  pct: number;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-primary-50 border border-emerald-200 rounded-2xl p-6">
      <div className="max-w-xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-base font-bold text-emerald-700">
            Profile {Math.round(pct)}% complete
          </span>
        </div>
        <p className="text-sm text-wealth-muted">
          Your financial profile is ready. Generate your personalised Health Score now.
        </p>
        <button
          id="generate-health-score-btn"
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Health Score
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FinancialProfileChatPage() {
  useDocumentTitle("Financial Profile");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    sessionId,
    sessionStatus,
    currentStep,
    messages,
    quickReplies,
    allowFreeText,
    completionPct,
    isValidAnswer,
    validationMessage,
    chatLoading,
    chatError,
    snapshotLoading,
  } = useAppSelector(selectFinancialProfile);

  const [input, setInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [noTransaction, setNoTransaction] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-start session on mount
  useEffect(() => {
    if (sessionStatus === "idle") {
      dispatch(fetchFinancialProfile());
      dispatch(startChatSession())
        .unwrap()
        .catch((err: string) => {
          const lower = err.toLowerCase();
          if (
            lower.includes("upload") ||
            lower.includes("statement") ||
            lower.includes("transaction")
          ) {
            setNoTransaction(true);
          }
        });
    }
  }, [dispatch, sessionStatus]);

  // Show text input if backend allows free text for current question
  useEffect(() => {
    setShowTextInput(allowFreeText);
    setInput("");
  }, [allowFreeText, currentStep]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !sessionId || chatLoading) return;
    setInput("");
    dispatch(clearValidationMessage());
    await dispatch(sendChatMessage({ sessionId, message: msg }));
    inputRef.current?.focus();
  };

  const handlePrevious = async () => {
    if (currentStep === 0 || !sessionId || chatLoading) return;
    dispatch(clearValidationMessage());
    await dispatch(goToPreviousStep(sessionId));
  };

  const handleChipClick = (choice: string) => {
    void handleSend(choice);
  };

  const handleOtherClick = () => {
    setShowTextInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleGenerateScore = async () => {
    const result = await dispatch(calculateHealthScore());
    if (calculateHealthScore.fulfilled.match(result)) {
      navigate(ROUTES.HEALTH_SCORE);
    }
  };

  if (noTransaction) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Financial Profile"
          description="Tell us about your finances to get a personalised Health Score"
        />
        <NoTransactionState />
      </div>
    );
  }

  const isComplete = sessionStatus === "completed";
  // Show chips area when: not complete, not loading, replies exist
  const hasChips = !isComplete && !chatLoading && quickReplies && quickReplies.length > 0;
  // Show text input area when: not complete and (allowFreeText OR user clicked Other)
  const showInput = !isComplete && (showTextInput || allowFreeText);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-4">
      <PageHeader
        title="Financial Profile"
        description="Answer a few questions so we can personalise your Health Score"
      />

      <ProgressBar step={currentStep} pct={completionPct} />

      {/* Chat window */}
      <div className="bg-white border border-wealth-border rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* Message list */}
        <div
          className="overflow-y-auto p-6 space-y-5"
          style={{ minHeight: 360, maxHeight: 480 }}
        >
          {messages.map((msg, i) =>
            msg.sender === "user" ? (
              <UserBubble key={msg.id ?? i} text={msg.message} />
            ) : (
              <AssistantBubble key={msg.id ?? i} text={msg.message} />
            ),
          )}
          {chatLoading && <TypingIndicator />}

          {/* Validation warning inside chat */}
          {!isValidAnswer && validationMessage && (
            <div className="flex items-start gap-3 justify-start animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 max-w-lg">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                  <p className="text-sm font-medium">{validationMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Network / server error banner */}
        {chatError && (
          <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-xs text-red-700">{chatError}</p>
            <button
              onClick={() => dispatch(clearChatError())}
              className="text-red-400 hover:text-red-600 ml-4 text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Chat controls area */}
        {!isComplete && (
          <div className="border-t border-wealth-border bg-gray-50/50 p-4 space-y-3">
            {/* Quick-reply chips */}
            {hasChips && (
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleChipClick(choice)}
                    disabled={chatLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 border border-primary-200 rounded-full transition-colors disabled:opacity-50"
                  >
                    {choice}
                  </button>
                ))}
                {/* "Other" button only when backend allows free text */}
                {allowFreeText && !showTextInput && (
                  <button
                    onClick={handleOtherClick}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"
                  >
                    Other…
                  </button>
                )}
              </div>
            )}

            {/* Bottom Controls Row: Previous Button & Text Input */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0 || chatLoading || !sessionId}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Previous
              </button>

              {showInput && (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={chatLoading || !sessionId}
                    placeholder="Type your answer…"
                    className="flex-1 text-sm bg-white border border-wealth-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    id="chat-send-btn"
                    onClick={() => void handleSend()}
                    disabled={chatLoading || !input.trim() || !sessionId}
                    className="flex-shrink-0 w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
                    aria-label="Send message"
                  >
                    {chatLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Completion CTA */}
      {isComplete && (
        <CompletionCard
          pct={completionPct}
          onGenerate={handleGenerateScore}
          generating={snapshotLoading}
        />
      )}
    </div>
  );
}
