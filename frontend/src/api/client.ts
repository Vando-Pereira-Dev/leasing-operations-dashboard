import type { ApiError } from "@/types/api";

function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return "/api";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `https://${raw.replace(/\/$/, "")}`;
}

const API_BASE = resolveApiBase();

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiError;
    if (typeof body.detail === "string") return body.detail;
    return JSON.stringify(body.detail);
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new ApiRequestError(response.status, await parseError(response));
  }
  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  file: File,
): Promise<T> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<T>(path, { method: "POST", body });
}
