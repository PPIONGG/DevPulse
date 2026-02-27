import { withTimeout } from "@/lib/utils/with-timeout";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeout = 15_000
): Promise<T> {
  const res = await withTimeout(
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }),
    timeout
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, timeout?: number) =>
    request<T>(path, { method: "GET" }, timeout),

  post: <T>(path: string, body?: unknown, timeout?: number) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, timeout),

  put: <T>(path: string, body?: unknown, timeout?: number) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, timeout),

  delete: <T>(path: string, timeout?: number) =>
    request<T>(path, { method: "DELETE" }, timeout),

  upload: <T>(path: string, formData: FormData, timeout = 30_000) =>
    withTimeout(
      fetch(`${BASE_URL}${path}`, {
        method: "POST",
        credentials: "include",
        body: formData,
        // No Content-Type header — browser sets it with boundary
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: res.statusText }));
          throw new ApiError(res.status, body.error || res.statusText);
        }
        return res.json() as Promise<T>;
      }),
      timeout
    ),
};
