import { supabase } from '../supabaseClient';

type ApiOptions = RequestInit & { json?: unknown };

export async function apiFetch<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token ?? '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    method: options.method ?? (options.json ? 'POST' : 'GET'),
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json() as Promise<T>;
}
