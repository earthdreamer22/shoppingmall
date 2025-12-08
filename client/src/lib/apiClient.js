const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function needsCsrf(method = 'GET') {
  return !SAFE_METHODS.includes(method.toUpperCase());
}

function getCsrfTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map((chunk) => chunk.trim()).find((chunk) => chunk.startsWith('csrfToken='));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
}

export async function apiRequest(path, options = {}) {
  const config = {
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  };

  const method = config.method ? config.method.toUpperCase() : 'GET';

  if (config.body && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  if (needsCsrf(method) && !config.headers[CSRF_HEADER] && typeof document !== 'undefined') {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      config.headers[CSRF_HEADER] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  if (!response.ok) {
    // Default fallback message for unexpected errors
    let message = '요청 처리 중 오류가 발생했습니다.';
    const raw = await response.text();
    if (raw) {
      try {
        const data = JSON.parse(raw);
        message = data?.message ?? message;
      } catch (_error) {
        // If the body is plain text, surface it as-is
        message = raw;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export { API_BASE_URL };
