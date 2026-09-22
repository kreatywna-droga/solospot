/**
 * UpstreamErrorClassifier.ts — Classify provider HTTP/network failures.
 *
 * Pure functions (unit-testable) used by OpenCodeProvider to map raw
 * upstream failures to a stable errorType + honest user-facing message.
 *
 * Rules (Status Integrity Fix + Free Provider Isolation Gate):
 * - 429 → RATE_LIMIT → status ERROR (never NOT_CONFIGURED, never CHAT)
 * - 5xx/timeout/network → UPSTREAM_UNAVAILABLE / TIMEOUT → ERROR
 * - 401/403 → AUTH → ERROR
 * - 404 model → MODEL_NOT_FOUND → ERROR
 * - missing key → handled separately as NOT_CONFIGURED (not here)
 */

export type UpstreamErrorType =
  | 'RATE_LIMIT'
  | 'AUTH'
  | 'MODEL_NOT_FOUND'
  | 'UPSTREAM_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export function classifyUpstreamError(params: {
  httpStatus?: number;
  bodyMessage?: string;
  networkError?: string;
}): UpstreamErrorType {
  const { httpStatus, bodyMessage = '', networkError = '' } = params;

  if (networkError) {
    if (/timeout|aborted|abort/i.test(networkError)) return 'TIMEOUT';
    return 'UPSTREAM_UNAVAILABLE';
  }

  const body = bodyMessage.toLowerCase();
  if (/rate limit|too many requests|free-models-per-day|quota|usage limit|retry-after/.test(body)) {
    return 'RATE_LIMIT';
  }

  if (httpStatus === 429) return 'RATE_LIMIT';
  if (httpStatus === 401 || httpStatus === 403) return 'AUTH';
  if (httpStatus === 404) return 'MODEL_NOT_FOUND';
  if (httpStatus !== undefined && httpStatus >= 500) return 'UPSTREAM_UNAVAILABLE';
  if (httpStatus !== undefined && httpStatus >= 400) return 'UNKNOWN';

  return 'UNKNOWN';
}

/** Strip secrets from an upstream message before surfacing any fragment to the user/logs. */
export function sanitizeUpstreamMessage(message: string, maxLength = 200): string {
  return String(message || '')
    .replace(/sk-[A-Za-z0-9\-_]{10,}/g, 'sk-***')
    .replace(/Bearer\s+\S+/gi, 'Bearer ***')
    .replace(/api[_-]?key["'\s:=]+["']?[A-Za-z0-9\-_]{8,}["']?/gi, 'api_key=***')
    .trim()
    .substring(0, maxLength);
}

/**
 * Honest user-facing Polish message per classified error.
 * Must never claim "server overloaded" without evidence of 5xx/timeout.
 * Must never claim NOT_CONFIGURED for 429.
 */
export function getUserFacingProviderError(
  errorType: UpstreamErrorType,
  modelId: string,
  safeUpstreamDetail?: string
): string {
  const modelPart = modelId && modelId !== 'UNKNOWN' ? ` (${modelId})` : '';
  const detail = safeUpstreamDetail ? `\nSzczegóły: ${safeUpstreamDetail}` : '';

  switch (errorType) {
    case 'RATE_LIMIT':
      return (
        `Bezpłatny provider AI odrzucił żądanie${modelPart} z powodu limitu darmowych żądań. ` +
        `Spróbuj ponownie później lub wybierz inny darmowy model w menu powyżej.${detail}`
      );
    case 'AUTH':
      return (
        `Provider AI odrzucił żądanie${modelPart} z powodu błędu uwierzytelnienia. ` +
        `Skontaktuj się z administratorem środowiska (status 401/403).${detail}`
      );
    case 'MODEL_NOT_FOUND':
      return (
        `Model${modelPart} nie jest dostępny u provider'a. Wybierz inny darmowy model w menu powyżej.${detail}`
      );
    case 'UPSTREAM_UNAVAILABLE':
      return (
        `Zewnętrzny provider AI jest chwilowo niedostępny${modelPart} (błąd serwera lub sieci). ` +
        `Spróbuj ponownie za chwilę.${detail}`
      );
    case 'TIMEOUT':
      return (
        `Upłynął limit czasu oczekiwania na odpowiedź modelu${modelPart} (15s). ` +
        `Spróbuj ponownie lub wybierz szybszy model w menu powyżej.`
      );
    default:
      return (
        `Nie udało się uzyskać odpowiedzi z wybranego modelu${modelPart}. ` +
        `Spróbuj ponownie lub wybierz inny model w menu powyżej.${detail}`
      );
  }
}
