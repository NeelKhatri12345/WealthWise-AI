import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  analyzeStatement,
  sendAnalysisChat,
  appendUserMessage,
  setMessageFeedback,
  clearChatHistory,
  clearAnalysis,
  clearSendError,
  restoreChatHistory,
} from "@/store/slices/financialAnalysisSlice";
import { fetchFinancialProfile, fetchLatestSnapshot } from "@/store/slices/financialProfileSlice";
import { fetchDashboardSummary } from "@/store/slices/dashboardSlice";
import { fetchStatements } from "@/store/slices/uploadSlice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Avatar } from "@/components/ui/Avatar";
import { ContextSummaryCard } from "@/components/ai-coach/ContextSummaryCard";
import { SuggestedQuestions } from "@/components/ai-coach/SuggestedQuestions";
import { TypingIndicator } from "@/components/ai-coach/TypingIndicator";
import { ROUTES } from "@/routes/routes";
import { cn } from "@/utils/cn";
import { toast } from "react-hot-toast";
import type { StatementDetail } from "@/services/api/upload.api";
import {
  clearPersistedChat,
  loadPersistedChat,
  loadPersistedScroll,
  savePersistedChat,
  savePersistedScroll,
} from "./chatPersistence";

function parseRecommendation(rec: string) {
  // Extract the emoji at the start
  const emojiMatch = rec.match(/^([\u2300-\u27BF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]\s*)/);
  let emoji = "";
  let restOfText = rec;
  if (emojiMatch) {
    emoji = emojiMatch[0].trim();
    restOfText = rec.substring(emojiMatch[0].length).trim();
  }
  
  // Split the rest by the first "." to get Title and Description
  const dotIndex = restOfText.indexOf(".");
  let title = restOfText;
  let description = "";
  if (dotIndex !== -1) {
    title = restOfText.substring(0, dotIndex).trim();
    description = restOfText.substring(dotIndex + 1).trim();
  }
  
  // Custom titles for better UX if they match certain words
  let displayTitle = title;
  let displayDescription = description;
  
  if (title.toLowerCase().includes("expenses exceeded")) {
    displayTitle = "Reduce discretionary spending";
    displayDescription = "You spent more than you earned this period. " + description;
  } else if (title.toLowerCase().includes("bank charges")) {
    displayTitle = "Reduce bank charges";
    displayDescription = description || title;
  } else if (title.toLowerCase().includes("savings rate is below 10")) {
    displayTitle = "Increase savings rate";
    displayDescription = "Your savings rate is critically low. " + description;
  } else if (title.toLowerCase().includes("savings rate is below the recommended 20")) {
    displayTitle = "Optimize your savings";
    displayDescription = description;
  } else if (title.toLowerCase().includes("no investment transactions")) {
    displayTitle = "Start investing";
    displayDescription = description;
  } else if (title.toLowerCase().includes("weekend")) {
    displayTitle = "Control weekend spending";
    displayDescription = description;
  } else if (title.toLowerCase().includes("active loan")) {
    displayTitle = "Build emergency fund";
    displayDescription = description;
  } else if (title.toLowerCase().includes("finances look healthy")) {
    displayTitle = "Keep up the good work";
    displayDescription = description;
  }
  
  return { title: displayTitle, description: displayDescription, emoji };
}

export default function AICoachPage() {
  useDocumentTitle("AI Financial Coach");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const { summary, analyzing, analyzeError, chatHistory, sending, sendError, analyzedStatementId } =
    useAppSelector((state) => state.financialAnalysis);
  const { profile, snapshot, profileLoading, snapshotLoading } =
    useAppSelector((state) => state.financialProfile);
  const { statements, isFetchingStatements } = useAppSelector((state) => state.upload);
  const user = useAppSelector((state) => state.auth.user);
  const userName = user?.fullName || user?.email || "User";

  useEffect(() => {
    console.log("===== Ask AI Debug =====");
    console.log("Statements:", statements);

    if (statements.length > 0) {
        console.log(
            "Statuses:",
            statements.map((s) => ({
                id: s.id,
                file: s.fileName,
                status: s.status,
            }))
        );
    }
}, [statements]);

  // Local state
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const [contextVisible, setContextVisible] = useState(true);
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  const lastChatScrollY = useRef(0);
  const isRestoringScrollRef = useRef(false);
  const chatRestoredForStatementRef = useRef<string | null>(null);
  const scrollRestoredForStatementRef = useRef<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userId = user?.id ?? "anonymous";

  // 1. Initial Load: Fetch essential context & statements
  useEffect(() => {
    dispatch(fetchFinancialProfile());
    dispatch(fetchLatestSnapshot());
    dispatch(fetchDashboardSummary());
    dispatch(fetchStatements());
  }, [dispatch]);

  // 2. Select latest COMPLETED statement once statements are loaded and manage auto-selection
  useEffect(() => {
    const completed = statements.filter(
      (s) => s.status?.toLowerCase() === "completed"
    );
    const completedIds = new Set(completed.map((s) => s.id));

    // Find any statements that were NOT previously completed
    const newlyCompleted = completed.filter(
      (s) => !prevCompletedIdsRef.current.has(s.id)
    );

    if (newlyCompleted.length > 0) {
      // Find the latest newly completed statement by sorting by createdAt
      const sorted = [...newlyCompleted].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestNew = sorted[0];

      // Auto-select on first load or if a statement has completed, but only if the user is not in an active conversation
      if (!selectedStatementId || chatHistory.length === 0) {
        setSelectedStatementId(latestNew.id);
      }
    }

    prevCompletedIdsRef.current = completedIds;
  }, [statements, selectedStatementId, chatHistory.length]);

  // 3. Dispatch analysis when selectedStatementId changes
  useEffect(() => {
    if (selectedStatementId) {
      dispatch(analyzeStatement(selectedStatementId));
    } else {
      dispatch(clearAnalysis());
    }
  }, [selectedStatementId, dispatch]);

  // 3b. Reset scroll/context tracking when switching statements
  useEffect(() => {
    lastChatScrollY.current = 0;
    setContextVisible(true);
  }, [selectedStatementId]);

  // 3c. Allow chat/scroll restore after each analysis run completes
  useEffect(() => {
    if (!analyzing) return;
    chatRestoredForStatementRef.current = null;
    scrollRestoredForStatementRef.current = null;
  }, [analyzing]);

  // 4. Restore persisted chat after analysis completes for the selected statement
  useEffect(() => {
    if (!selectedStatementId || analyzing) return;
    if (analyzedStatementId !== selectedStatementId) return;
    if (chatRestoredForStatementRef.current === selectedStatementId) return;

    chatRestoredForStatementRef.current = selectedStatementId;
    const saved = loadPersistedChat(userId, selectedStatementId);
    if (saved.length > 0) {
      dispatch(restoreChatHistory(saved));
    }
  }, [analyzedStatementId, selectedStatementId, analyzing, userId, dispatch]);

  // 5. Persist chat history to localStorage (skip empty to avoid clearing during analysis)
  useEffect(() => {
    if (!selectedStatementId || chatHistory.length === 0) return;
    savePersistedChat(userId, selectedStatementId, chatHistory);
  }, [chatHistory, selectedStatementId, userId]);

  // 6. Restore scroll position once after chat is loaded for a statement
  useEffect(() => {
    if (!selectedStatementId || chatHistory.length === 0) return;
    if (scrollRestoredForStatementRef.current === selectedStatementId) return;

    scrollRestoredForStatementRef.current = selectedStatementId;
    const savedScroll = loadPersistedScroll(userId, selectedStatementId);
    if (savedScroll == null) return;

    isRestoringScrollRef.current = true;
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = savedScroll;
      }
      requestAnimationFrame(() => {
        isRestoringScrollRef.current = false;
      });
    });
  }, [chatHistory.length, selectedStatementId, userId]);

  // 7. Scroll to bottom on new messages unless restoring saved scroll position
  useEffect(() => {
    if (isRestoringScrollRef.current) return;
    scrollToBottom();
  }, [chatHistory, sending]);

  // 8. Toast error if analysis fails
  useEffect(() => {
    if (analyzeError) {
      toast.error(analyzeError);
    }
  }, [analyzeError]);

  // 9. Toast error if chat sending fails
  useEffect(() => {
    if (sendError) {
      toast.error(sendError);
      dispatch(clearSendError());
    }
  }, [sendError, dispatch]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const isNearBottom = maxScroll > 0 && scrollTop >= maxScroll - 5;

    if (scrollTop <= 10) {
      setContextVisible(true);
    } else if (scrollTop > lastChatScrollY.current + 5) {
      setContextVisible(false);
    } else if (scrollTop < lastChatScrollY.current - 5 && !isNearBottom) {
      setContextVisible(true);
    }
    lastChatScrollY.current = scrollTop;

    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);

    if (selectedStatementId) {
      savePersistedScroll(userId, selectedStatementId, scrollTop);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = (textToSend = input) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending || !summary) return;

    // Append user message instantly
    const userMsgId = `user-${Date.now()}`;
    dispatch(appendUserMessage({ id: userMsgId, content: trimmed }));
    setInput("");

    // Dispatch chat request with FinancialSummary context
    dispatch(sendAnalysisChat({ summary, question: trimmed }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    dispatch(setMessageFeedback({ id: messageId, feedback: type }));
    toast.success("Feedback submitted!");
  };

  const handleAskFollowUp = (messageContent: string) => {
    const defaultFollowUp = `Can you explain more about this: "${messageContent.split(".")[0]}..."?`;
    setInput(defaultFollowUp);
  };

  const handleSelectStatement = (stmt: StatementDetail) => {
    if (stmt.status?.toLowerCase() !== "completed") {
      toast.error(`This statement is currently ${stmt.status}. Please select a completed statement.`);
      return;
    }
    setSelectedStatementId(stmt.id);
  };

  // ── Prerequisite Validation ───────────────────────────────────────────────

  const completedStatements = statements.filter((s) => s.status?.toUpperCase() === "COMPLETED");
  const hasNoTransactions = !isFetchingStatements && completedStatements.length === 0;

  const isProfileIncomplete = profile !== null && profile.profile_completion_percentage < 100.0;
  const isHealthScoreMissing = snapshot === null && !snapshotLoading;
  const isRiskProfileMissing = snapshot !== null && snapshot.risk_profile === null;

  if (
    profileLoading ||
    snapshotLoading ||
    isFetchingStatements ||
    (analyzing && !summary)
  ) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-sm text-wealth-muted">
            {analyzing ? "Analyzing statement transactions..." : "Loading your financial context..."}
          </p>
        </div>
      </div>
    );
  }

  // 1. Transaction empty state
  if (hasNoTransactions) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto py-12 px-4">
        <PageHeader title="AI Financial Coach" description="Get personalized financial advice" />
        <Card padding="lg" className="text-center space-y-4 border-wealth-border shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Upload and accept a bank statement first</h2>
          <p className="text-sm text-wealth-muted max-w-md mx-auto">
            WealthWise Ask AI relies on transaction data to analyze your spending and savings. Please upload your statement first.
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.UPLOAD)}>
            Go to Upload Statement
          </Button>
        </Card>
      </div>
    );
  }

  // 2. Profile completion empty state
  if (isProfileIncomplete || !profile) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto py-12 px-4">
        <PageHeader title="AI Financial Coach" description="Get personalized financial advice" />
        <Card padding="lg" className="text-center space-y-4 border-wealth-border shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Complete Financial Profile first</h2>
          <p className="text-sm text-wealth-muted max-w-md mx-auto">
            Please answer the FinProfileBot questions to help us understand your financial context and build your score.
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.FINANCIAL_PROFILE)}>
            Complete Financial Profile
          </Button>
        </Card>
      </div>
    );
  }

  // 3. Health score empty state
  if (isHealthScoreMissing) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto py-12 px-4">
        <PageHeader title="AI Financial Coach" description="Get personalized financial advice" />
        <Card padding="lg" className="text-center space-y-4 border-wealth-border shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Generate your Health Score first</h2>
          <p className="text-sm text-wealth-muted max-w-md mx-auto">
            Your final Hybrid Health Score is calculated combining your statement history and your profile.
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.HEALTH_SCORE)}>
            Generate Health Score
          </Button>
        </Card>
      </div>
    );
  }

  // 4. Risk profile empty state
  if (isRiskProfileMissing) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto py-12 px-4">
        <PageHeader title="AI Financial Coach" description="Get personalized financial advice" />
        <Card padding="lg" className="text-center space-y-4 border-wealth-border shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Generate your Health Score & Risk Profile</h2>
          <p className="text-sm text-wealth-muted max-w-md mx-auto">
            Unlock your investment style by generating your Health Score & Risk Profile based on your current readiness scores.
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.HEALTH_SCORE)}>
            Generate Health Score
          </Button>
        </Card>
      </div>
    );
  }

  // Welcome message construction using parsed data
  const renderRecommendationCard = (title: string, description: string, emoji: string, index: number) => (
    <div 
      key={index} 
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg shrink-0">{emoji || "💡"}</span>
          <h3 className="text-xs font-bold text-gray-800">
            {title}
          </h3>
        </div>
        <p className="text-[11px] text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[10px] font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-0.5 h-6 flex items-center gap-1"
          onClick={() => handleSendMessage(`Can you explain how to ${title.toLowerCase()}?`)}
        >
          <span>Learn More</span>
          <span className="text-[9px]">→</span>
        </Button>
      </div>
    </div>
  );

  const welcomeSummaryText = (
    <div className="space-y-4">
      <p className="text-gray-700 leading-relaxed text-sm">
        Welcome to your **WealthWise Ask AI**! Based on the analyzed statement, your Financial Health Score is **{summary?.health_score ?? snapshot?.score ?? 0}/100**. You possess a **{snapshot?.risk_profile ?? "Moderate"}** risk profile style, and your savings rate is **{summary?.savings_rate.toFixed(1) ?? "0.0"}%**.
      </p>
      
      {/* Dynamic Recommendation Cards */}
      {((summary?.structured_recommendations && summary.structured_recommendations.length > 0) || 
        (summary?.recommendations && summary.recommendations.length > 0)) && (
        <div className="space-y-3 mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            AI Recommendations
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary?.structured_recommendations && summary.structured_recommendations.length > 0
              ? summary.structured_recommendations.map((rec, i) => 
                  renderRecommendationCard(rec.title, rec.description, rec.emoji, i)
                )
              : summary?.recommendations?.map((recStr, i) => {
                  const parsed = parseRecommendation(recStr);
                  return renderRecommendationCard(parsed.title, parsed.description, parsed.emoji, i);
                })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-wealth-border bg-wealth-card animate-fade-in">
      
      {/* ── Left Sidebar panel (Statement selector) ──────────────────────── */}
      <div className="flex w-64 shrink-0 flex-col border-r border-wealth-border bg-gray-50/50">
        <div className="p-4 border-b border-wealth-border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Statements Available</p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full flex items-center justify-center gap-1.5"
            onClick={() => navigate(ROUTES.UPLOAD)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload New</span>
          </Button>
        </div>

        {/* Statement list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {statements.length === 0 ? (
            <div className="p-4 text-center text-xs text-wealth-muted">No statements found</div>
          ) : !isDropdownExpanded ? (
            // Collapsed view: Show ONLY the currently selected statement
            (() => {
              const selectedStmt = statements.find((s) => s.id === selectedStatementId);
              if (!selectedStmt) return <div className="text-center text-xs text-wealth-muted">No statement selected</div>;
              const status = selectedStmt.status?.toUpperCase();
              return (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Statement</p>
                  <div className="rounded-xl border border-primary-200 bg-primary-50/30 p-3 shadow-sm relative">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl">📄</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-bold text-gray-800" title={selectedStmt.fileName}>
                          {selectedStmt.fileName}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                          {status === "COMPLETED" ? "Completed ✓" : selectedStmt.status}
                        </p>
                        <div className="text-[10px] text-wealth-muted mt-2">
                          <span className="block font-medium">Uploaded:</span>
                          <span>{new Date(selectedStmt.createdAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-between px-3 text-xs"
                    onClick={() => setIsDropdownExpanded(true)}
                  >
                    <span>Change Statement</span>
                    <span className="text-[10px]">▼</span>
                  </Button>
                </div>
              );
            })()
          ) : (
            // Expanded view: Show the dropdown / list of statements
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Statement</p>
                <button 
                  onClick={() => setIsDropdownExpanded(false)} 
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Collapse ▲
                </button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto border border-gray-150 rounded-lg p-1 bg-white">
                {statements.map((s) => {
                  const isSelected = selectedStatementId === s.id;
                  const status = s.status?.toUpperCase();
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        handleSelectStatement(s);
                        setIsDropdownExpanded(false);
                      }}
                      className={cn(
                        "group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 border transition-all text-xs",
                        isSelected
                          ? "bg-primary-50 text-primary-700 border-primary-100 font-medium"
                          : "text-wealth-muted border-transparent hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <span className="text-sm shrink-0">
                        {isSelected ? "✓" : "○"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs text-gray-800">{s.fileName}</p>
                        <div className="flex items-center justify-between text-[9px] mt-0.5">
                          <span className="text-gray-400">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                          <Badge
                            variant={
                              status === "COMPLETED"
                                ? "success"
                                : status === "PROCESSING"
                                ? "warning"
                                : status === "FAILED"
                                ? "danger"
                                : "info"
                            }
                            size="sm"
                            className="scale-90 origin-right py-0 px-1"
                          >
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reset Chat for current statement */}
        {chatHistory.length > 0 && (
          <div className="p-4 border-t border-wealth-border bg-gray-50">
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => {
                if (confirm("Reset chat history for this statement?")) {
                  dispatch(clearChatHistory());
                  if (selectedStatementId) {
                    clearPersistedChat(userId, selectedStatementId);
                  }
                  chatRestoredForStatementRef.current = selectedStatementId;
                  scrollRestoredForStatementRef.current = selectedStatementId;
                  lastChatScrollY.current = 0;
                  setContextVisible(true);
                }
              }}
            >
              Reset Conversation
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Chat Panel ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-white">
        
        {/* Context Summary Card header — hides on chat scroll */}
        <div
          className={cn(
            "grid shrink-0 transition-[grid-template-rows] duration-300 ease-in-out",
            contextVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className={cn(
                "border-b border-wealth-border bg-gray-50/20 p-4 transition-all duration-300 ease-in-out",
                contextVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
              )}
            >
              <ContextSummaryCard />
            </div>
          </div>
        </div>

        {/* Scrollable chat body */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {/* Statement aggregate metrics grid */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto mb-2 animate-fade-in">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 shadow-sm">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Income</span>
                <span className="text-base font-extrabold text-green-600 block mt-0.5">
                  ₹{summary.total_income.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Average: ₹{summary.average_credit.toLocaleString()}</span>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 shadow-sm">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Expense</span>
                <span className="text-base font-extrabold text-red-500 block mt-0.5">
                  ₹{summary.total_expense.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Average: ₹{summary.average_debit.toLocaleString()}</span>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 shadow-sm">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Savings Rate</span>
                <span className="text-base font-extrabold text-primary-600 block mt-0.5">
                  {summary.savings_rate.toFixed(1)}%
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Net: ₹{summary.net_savings.toLocaleString()}</span>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 shadow-sm">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Key Category</span>
                <span className="text-sm font-extrabold text-gray-800 block mt-1 truncate">
                  {summary.top_expense_categories?.[0]?.category ?? "N/A"}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  {summary.top_expense_categories?.[0]?.percentage.toFixed(0) ?? 0}% of expenses
                </span>
              </div>
            </div>
          )}

          {/* Welcome view & suggested questions */}
          {chatHistory.length === 0 && (
            <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fade-in">
              <Card padding="lg" className="border-primary-100 bg-gradient-to-br from-primary-50/20 to-white shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">WealthWise Coach</h2>
                    <p className="text-xs text-wealth-muted">Stateless Statement Analysis</p>
                  </div>
                </div>
                <div className="prose prose-sm text-gray-600">
                  {welcomeSummaryText}
                </div>
              </Card>

              {/* Suggestions list */}
              <SuggestedQuestions onSelectQuestion={handleSendMessage} />
            </div>
          )}

          {/* Active messages list */}
          {chatHistory.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-6">
              {chatHistory.map((m) => {
                const isUser = m.role === "user";
                const timeStr = new Date(m.timestamp).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3 animate-fade-in",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Bot / User Avatar */}
                    {isUser ? (
                      <Avatar name={userName} size="sm" className="flex-shrink-0 shadow-sm border border-secondary-200" />
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shadow-sm border border-primary-200">
                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    )}

                    {/* Content Block */}
                    <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[70%]">
                      {/* Bubble */}
                      <div
                        className={cn(
                          "rounded-2xl p-4 border shadow-sm text-sm whitespace-pre-wrap leading-relaxed",
                          isUser
                            ? "rounded-tr-none bg-primary-600 text-white border-primary-700"
                            : "rounded-tl-none bg-gray-50 text-gray-800 border-gray-100"
                        )}
                      >
                        {isUser ? (
                          m.content
                        ) : (
                          <div className="prose prose-sm prose-wealth max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Message Actions & Timestamp */}
                      <div className="flex items-center justify-between px-1 text-[10px] text-wealth-muted">
                        <span>{timeStr}</span>
                        {!isUser && (
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleCopyText(m.content)}
                              className="hover:text-primary-600 transition-colors flex items-center gap-0.5"
                              title="Copy response"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              Copy
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, "up")}
                              className={cn(
                                "hover:text-green-600 transition-colors",
                                m.feedback === "up" && "text-green-600 font-semibold"
                              )}
                            >
                              👍 Helpful
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, "down")}
                              className={cn(
                                "hover:text-red-600 transition-colors",
                                m.feedback === "down" && "text-red-600 font-semibold"
                              )}
                            >
                              👎 Not Helpful
                            </button>
                            <button
                              onClick={() => handleAskFollowUp(m.content)}
                              className="hover:text-primary-600 transition-colors"
                            >
                              Ask Follow-up
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Typing/Thinking Indicator */}
          {sending && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <TypingIndicator />
            </div>
          )}
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-all text-gray-600 z-10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* ── Input bar panel ──────────────────────────────────────────────── */}
        <div className="p-4 border-t border-wealth-border bg-white shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your savings, spending, or investment strategy..."
              className="flex-1 resize-none rounded-xl border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 max-h-24 h-11"
              disabled={sending || !summary}
            />
            <Button
              variant="primary"
              className="h-11 px-4 shrink-0 rounded-xl flex items-center justify-center gap-1.5"
              onClick={() => handleSendMessage()}
              disabled={sending || !input.trim() || !summary}
            >
              <span>Send</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
