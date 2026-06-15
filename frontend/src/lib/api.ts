/**
 * Typed fetch wrapper. All API calls from features should use this.
 * Throws on non-ok responses with a useful error message.
 */
export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || `Request failed with status ${res.status}`);
  }

  return json as T;
}
