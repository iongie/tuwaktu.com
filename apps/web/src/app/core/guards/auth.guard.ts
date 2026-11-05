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
import { sanitizeReturnUrl } from './admin.guard';

/**
 * Memeriksa apakah suatu URL mengarah ke area konsol dasbor pekerja.
 */
export function isDashboardUrl(url: string | null | undefined): boolean {
  const sanitized = sanitizeReturnUrl(url);
  if (!sanitized) {
    return false;
  }
  return (
    sanitized === '/dashboard' ||
    sanitized === '/dashboard/' ||
    sanitized.startsWith('/dashboard/') ||
    sanitized.startsWith('/dashboard?') ||
    sanitized.startsWith('/dashboard#') ||
    sanitized === '/plan' ||
    sanitized.startsWith('/plan?') ||
    sanitized === '/boost' ||
    sanitized.startsWith('/boost?')
  );
}

/**
 * Menormalisasi URL rute dasbor (misal /dashboard atau /dashboard/ diubah menjadi /dashboard/ringkasan).
 */
export function normalizeDashboardUrl(url: string): string {
  if (url === '/dashboard' || url === '/dashboard/') {
    return '/dashboard/ringkasan';
  }
  if (url.startsWith('/dashboard?') || url.startsWith('/dashboard#')) {
    return '/dashboard/ringkasan' + url.slice('/dashboard'.length);
  }
  if (url.startsWith('/dashboard/?') || url.startsWith('/dashboard/#')) {
    return '/dashboard/ringkasan' + url.slice('/dashboard/'.length);
  }
  if (url === '/dashboard/tarif' || url.startsWith('/dashboard/tarif?')) {
    return '/dashboard/tarif-layanan' + url.slice('/dashboard/tarif'.length);
  }
  if (url === '/dashboard/logistik' || url.startsWith('/dashboard/logistik?')) {
    return '/dashboard/logistik-radius' + url.slice('/dashboard/logistik'.length);
  }
  if (url === '/dashboard/jadwal' || url.startsWith('/dashboard/jadwal?')) {
    return '/dashboard/kalender-slot' + url.slice('/dashboard/jadwal'.length);
  }
  if (url === '/dashboard/whatsapp' || url.startsWith('/dashboard/whatsapp?')) {
    return '/dashboard/integrasi-whatsapp' + url.slice('/dashboard/whatsapp'.length);
  }
  if (url === '/dashboard/profile' || url.startsWith('/dashboard/profile?')) {
    return '/dashboard/integrasi-whatsapp' + url.slice('/dashboard/profile'.length);
  }
  if (url === '/plan' || url.startsWith('/plan?')) {
    return '/dashboard/plan' + url.slice('/plan'.length);
  }
  if (url === '/boost' || url.startsWith('/boost?')) {
    return '/dashboard/boost' + url.slice('/boost'.length);
  }
  return url;
}

/**
 * Route guard yang memastikan rute dasbor pekerja hanya dapat diakses oleh pengguna yang sudah masuk (authenticated).
 * Jika pengguna belum terotentikasi:
 *   Mengalihkan paksa ke /login dengan parameter returnUrl (misal /login?returnUrl=/dashboard/ringkasan).
 * Jika pengguna sudah login:
 *   Mengizinkan akses ke halaman dasbor.
 */
export const authGuard: CanActivateFn & CanActivateChildFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const resolveTargetUrl = (): string => {
    const rawUrl = state?.url;
    const sanitized = sanitizeReturnUrl(rawUrl);
    if (sanitized && sanitized !== '/' && !sanitized.startsWith('/login')) {
      return normalizeDashboardUrl(sanitized);
    }
    return '/dashboard/ringkasan';
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
    return true;
  }

  return authService.checkSession().pipe(
    map((user) => {
      if (!user) {
        return createLoginRedirectTree();
      }
      return true;
    }),
    catchError(() => of(createLoginRedirectTree()))
  );
};
