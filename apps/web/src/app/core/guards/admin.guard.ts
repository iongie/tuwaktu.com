import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Memastikan URL return internal aman dan bukan open-redirect eksternal.
 */
export function sanitizeReturnUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const trimmed = url.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('/login')
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Memeriksa apakah suatu URL mengarah ke area panel admin internal.
 */
export function isAdminUrl(url: string | null | undefined): boolean {
  const sanitized = sanitizeReturnUrl(url);
  if (!sanitized) {
    return false;
  }
  return (
    sanitized === '/admin' ||
    sanitized === '/admin/' ||
    sanitized.startsWith('/admin/') ||
    sanitized.startsWith('/admin?') ||
    sanitized.startsWith('/admin#')
  );
}

/**
 * Menormalisasi URL rute admin (misal /admin atau /admin/ diubah menjadi /admin/workers).
 */
export function normalizeAdminUrl(url: string): string {
  if (url === '/admin' || url === '/admin/') {
    return '/admin/workers';
  }
  if (url.startsWith('/admin?') || url.startsWith('/admin#')) {
    return '/admin/workers' + url.slice('/admin'.length);
  }
  if (url.startsWith('/admin/?') || url.startsWith('/admin/#')) {
    return '/admin/workers' + url.slice('/admin/'.length);
  }
  return url;
}

/**
 * Route guard yang memastikan rute admin hanya dapat diakses oleh akun dengan wewenang ADMIN.
 * Jika pengguna belum terotentikasi:
 *   Mengalihkan ke /login dengan parameter returnUrl (misal /login?returnUrl=/admin/workers).
 * Jika pengguna sudah login namun bukan ADMIN (misalnya pekerja biasa):
 *   Mengalihkan ke /dashboard dan menolak akses ke panel admin.
 */
export const adminGuard: CanActivateFn & CanActivateChildFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const resolveTargetUrl = (): string => {
    const rawUrl = state?.url;
    const sanitized = sanitizeReturnUrl(rawUrl);
    if (sanitized && sanitized !== '/' && !sanitized.startsWith('/login')) {
      return normalizeAdminUrl(sanitized);
    }
    return '/admin/workers';
  };

  const createLoginRedirectTree = (): UrlTree => {
    return router.createUrlTree(['/login'], {
      queryParams: {
        returnUrl: resolveTargetUrl(),
      },
    });
  };

  const currentUser = authService.currentUser();
  if (currentUser) {
    const role = (currentUser.role || '').toUpperCase();
    if (role === 'ADMIN') {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  }

  // Jika sinyal memori belum ter-hydrate, verifikasi sesi via checkSession (GET /api/v1/auth/me)
  return authService.checkSession().pipe(
    map((user) => {
      if (!user) {
        return createLoginRedirectTree();
      }
      const role = (user.role || '').toUpperCase();
      if (role === 'ADMIN') {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    }),
    catchError(() => of(createLoginRedirectTree()))
  );
};


