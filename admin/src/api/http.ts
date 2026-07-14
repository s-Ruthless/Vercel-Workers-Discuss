/**
 * HTTP client for the admin panel.
 * All requests are same-origin (relative paths), since the admin SPA
 * and the API are deployed together on Vercel.
 */

export function getApiBaseUrl(): string {
  // Same-origin: no base URL needed.
  // Kept for backward compatibility with S3BackupModal download URLs.
  return '';
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('vwd_admin_token');
  const headers: HeadersInit = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = data && data.message ? data.message : `请求失败，状态码 ${res.status}`;
    if (res.status === 401 && (message === 'Token expired or invalid' || message === 'Unauthorized')) {
      localStorage.removeItem('vwd_admin_token');
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.pathname = '/admin/login';
          url.search = '';
          url.hash = '';
          window.location.href = url.toString();
        } catch {
          window.location.href = '/admin/login';
        }
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}
