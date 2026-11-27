/**
 * One place to turn a failed API call (an RTK Query / `.unwrap()` rejection) into
 * text a person can act on. The backend always answers failures with
 * `{ success: false, message, details? }`; when there is no response at all
 * (offline, CORS, timeout) the message comes from the transport instead.
 */

export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const NETWORK_ERROR_MESSAGE = 'Can’t reach the server. Check your internet connection and try again.';
export const TIMEOUT_ERROR_MESSAGE =
  'The server is taking too long to respond. It may be waking up — please try again in a moment.';
export const SERVER_ERROR_MESSAGE = 'Our server had a problem. Please try again in a moment.';
export const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a moment and try again.';

interface ErrorShape {
  status?: number | string;
  data?: unknown;
}

/** HTTP status of a failed call, or `undefined` when no response came back. */
export function apiErrorStatus(err: unknown): number | undefined {
  const status = (err as ErrorShape | null | undefined)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** First human-readable line out of the backend's `details` (zod field errors). */
function firstDetail(details: unknown): string | null {
  if (typeof details === 'string') return details;
  if (Array.isArray(details)) {
    for (const d of details) {
      const found = firstDetail(d);
      if (found) return found;
    }
    return null;
  }
  if (details && typeof details === 'object') {
    for (const value of Object.values(details)) {
      const found = firstDetail(value);
      if (found) return found;
    }
  }
  return null;
}

/** The server's own message for a failure, if the response carried one. */
function serverText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const { message, details } = data as { message?: unknown; details?: unknown };
  if (Array.isArray(message)) {
    const joined = message.filter((m) => typeof m === 'string' && m).join(', ');
    return joined || null;
  }
  if (typeof message !== 'string' || !message.trim()) return null;
  // "Validation failed" on its own doesn't say what to fix — show the first field error.
  if (message === 'Validation failed') return firstDetail(details) ?? message;
  return message;
}

/**
 * User-facing text for a failed API call.
 *   - server said why (400/401/403/404/409/413/429…) → that message
 *   - no response (offline / CORS / blocked)          → "Can't reach the server…"
 *   - timed out (e.g. a sleeping free-tier backend)   → "taking too long…"
 *   - 5xx without a usable message                    → "Our server had a problem…"
 *   - anything else                                   → `fallback`
 */
export function apiErrorMessage(err: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  const { status, data } = (err ?? {}) as ErrorShape;
  const code = typeof status === 'number' ? status : undefined;

  // A 5xx body is just "Internal server error" — not worth showing as-is.
  if (code !== undefined && code >= 500) return SERVER_ERROR_MESSAGE;

  const fromServer = serverText(data);
  if (fromServer) return fromServer;

  if (code === 429) return RATE_LIMIT_MESSAGE;

  if (code === undefined) {
    // Transport failure: RTK's own status strings, or axios' message as `data`.
    const text = typeof data === 'string' ? data : '';
    if (status === 'TIMEOUT_ERROR' || /timeout|aborted/i.test(text)) return TIMEOUT_ERROR_MESSAGE;
    if (status === 'FETCH_ERROR' || /network error|failed to fetch/i.test(text)) return NETWORK_ERROR_MESSAGE;
    // A rejection with `data` set but no status is still a transport failure.
    if (text) return NETWORK_ERROR_MESSAGE;
  }

  return fallback;
}
