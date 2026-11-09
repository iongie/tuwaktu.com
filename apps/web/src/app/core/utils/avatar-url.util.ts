import { environment } from '../../../environments/environment';

/**
 * Resolves raw avatar URL into a fully qualified browser-accessible URL.
 * If the URL is relative (e.g. starts with '/api/'), it prepends the backend apiBaseUrl.
 */
export function resolveAvatarUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) {
    return '';
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  // Preserve absolute URLs, data URLs, and blob preview URLs as-is
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Resolve relative media paths against apiBaseUrl (e.g. http://localhost:3000)
  const base = (environment.apiBaseUrl || '').replace(/\/+$/, '');
  let path = trimmed;
  if (!path.startsWith('/') && !path.startsWith('api/')) {
    path = `/api/v1/media/avatars/${path}`;
  } else if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${base}${path}`;
}

