import { notification as staticNotification } from "antd";
import { getApiError } from "@/api/client";
import { getGlobalNotification } from "@/utils/globalNotification";

const recentMessages = new Map<string, number>();
const MESSAGE_DEDUPE_WINDOW = 2000;

export function handleError(error: unknown, defaultMessage = "An error occurred"): void {
  console.error(error);

  const { message } = getApiError(error);
  const finalMessage = message || defaultMessage;

  const now = Date.now();
  const lastShown = recentMessages.get(finalMessage);
  if (lastShown && now - lastShown < MESSAGE_DEDUPE_WINDOW) return;

  recentMessages.set(finalMessage, now);
  for (const [msg, ts] of recentMessages) {
    if (now - ts > MESSAGE_DEDUPE_WINDOW) recentMessages.delete(msg);
  }

  const notifier = getGlobalNotification() ?? staticNotification;

  notifier.error({
    message: "Error",
    description: finalMessage,
    placement: "top",
    duration: 4,
  });
}

export function getErrorMessage(error: unknown, defaultMessage = "An error occurred"): string {
  const { message } = getApiError(error);
  return message || defaultMessage;
}
