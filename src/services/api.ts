export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Params = Record<string, string | number | undefined>;

export async function getJson<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const url = new URL(path, window.location.origin);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error ?? `Request failed (${response.status})`);
  }
  return response.json();
}
