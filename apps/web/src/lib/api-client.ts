const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// The access token lives only in memory - never localStorage/sessionStorage -
// so it disappears on a full page reload (the AuthProvider calls /auth/refresh
// on mount to get a new one from the httpOnly refresh cookie).
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Registered by AuthProvider so this module (which has no React/router
// access of its own) can tell it "the session is actually gone, not just
// the short-lived access token" whenever a silent refresh fails.
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
  }
}

// The validateBody/validateQuery middleware sends `details` as zod's
// flattened field errors: { fieldName: ["message", ...] }. Turns that into
// something readable instead of a generic "Validation failed".
export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const details = err.details as Record<string, string[] | undefined> | undefined;
    if (details && typeof details === "object") {
      const messages = Object.entries(details)
        .filter(([, msgs]) => msgs && msgs.length > 0)
        .map(([field, msgs]) => `${field}: ${msgs!.join(", ")}`);
      if (messages.length > 0) return messages.join(" | ");
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

interface RequestOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRetry, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    credentials: "include", // sends the httpOnly refresh cookie on /auth/* calls
  });

  // Access token expired mid-session: try exactly one silent refresh, then
  // retry the original request. skipAuthRetry stops /auth/refresh itself
  // from recursing if the refresh cookie has also expired.
  if (res.status === 401 && !skipAuthRetry && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, skipAuthRetry: true });
    }
    // The refresh itself failed - the whole session is gone, not just the
    // access token. /auth/me's own failure is handled locally by
    // AuthProvider (it just means "not logged in yet", the normal case on
    // a first visit) - for every other call, that raw backend message
    // ("Invalid or expired access token") isn't something a user should
    // ever see, so surface a friendly one and force back to login instead.
    if (path !== "/auth/me") {
      sessionExpiredHandler?.();
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? "Request failed", body?.details);
  }

  return body as T;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) return false;
    const body = await res.json();
    setAccessToken(body.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Separate from `request()` because file uploads need a multipart body -
// the browser sets its own Content-Type (with the multipart boundary), so
// we must NOT force "application/json" the way the JSON helpers do.
async function upload<T>(path: string, formData: FormData, skipAuthRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: formData,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    credentials: "include",
  });

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return upload<T>(path, formData, true);
    sessionExpiredHandler?.();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? "Upload failed", body?.details);
  }

  return body as T;
}

// For binary responses (Excel export, etc.) where we want the raw Blob and
// the server-suggested filename from Content-Disposition, not parsed JSON.
async function download(
  path: string,
  skipAuthRetry = false
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    credentials: "include",
  });

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return download(path, true);
    sessionExpiredHandler?.();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.message ?? "Download failed", body?.details);
  }

  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="([^"]+)"/)?.[1] ?? null;
  const blob = await res.blob();
  return { blob, filename };
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
  download: (path: string) => download(path),
};
