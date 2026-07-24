import { storage } from "@/lib/storage";
import type { ChatMessage } from "@/store/slices/financialAnalysisSlice";

const CHAT_KEY_PREFIX = "wealthwise-ask-ai-chat";
const SCROLL_KEY_PREFIX = "wealthwise-ask-ai-scroll";

function chatKey(userId: string, statementId: string): string {
  return `${CHAT_KEY_PREFIX}:${userId}:${statementId}`;
}

function scrollKey(userId: string, statementId: string): string {
  return `${SCROLL_KEY_PREFIX}:${userId}:${statementId}`;
}

export function loadPersistedChat(userId: string, statementId: string): ChatMessage[] {
  const data = storage.get<ChatMessage[]>(chatKey(userId, statementId));
  return Array.isArray(data) ? data : [];
}

export function savePersistedChat(
  userId: string,
  statementId: string,
  messages: ChatMessage[],
): void {
  storage.set(chatKey(userId, statementId), messages);
}

export function clearPersistedChat(userId: string, statementId: string): void {
  storage.remove(chatKey(userId, statementId));
  storage.remove(scrollKey(userId, statementId));
}

export function loadPersistedScroll(userId: string, statementId: string): number | null {
  const value = storage.get<number>(scrollKey(userId, statementId));
  return typeof value === "number" ? value : null;
}

export function savePersistedScroll(
  userId: string,
  statementId: string,
  scrollTop: number,
): void {
  storage.set(scrollKey(userId, statementId), scrollTop);
}
