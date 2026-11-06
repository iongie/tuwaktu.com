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
 * Menentukan URL pengalihan bagi pengguna yang sudah terotentikasi.
 * Mengarahkan ke panel admin jika wewenang ADMIN, atau ke dashboard jika mitra pekerja (WORKER).
 */
export function resolveAuthenticatedRedirectUrl(role: string | null | undefined): string {
  const normalizedRole = (role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') {
    return '/admin/workers';
  }
  return '/dashboard/ringkasan';
}

/**
 * Guest Guard (RedirectIfAuthenticatedGuard):
 * Pelindung rute khusus untuk rute tamu (/login atau /register).
 * Jika pengguna terdeteksi sudah login:
 *   Membatalkan akses dan mengarahkan langsung ke /admin (ADMIN) atau /dashboard (WORKER).
 * Jika pengguna belum login (tamu):
 *   Mengizinkan akses ke halaman masuk.
 * Jika status sesi masih dalam proses inisialisasi:
 *   Menahan eksekusi hingga checkAuthStatus selesai.
 */
export const guestGuard: CanActivateFn & CanActivateChildFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const resolveRedirect = (role?: string): UrlTree => {
    return router.createUrlTree([resolveAuthenticatedRedirectUrl(role)]);
  };

  const currentUser = authService.currentUser();
  if (currentUser) {
    return resolveRedirect(currentUser.role);
  }

  // Jika status autentikasi sudah selesai diinisialisasi dan pengguna memang tamu (currentUser null)
  if (authService.isInitialized()) {
    return true;
  }

  // Jika belum diinisialisasi (misal hard refresh rute /login), tahan eksekusi guard hingga checkAuthStatus selesai
  return authService.checkAuthStatus().pipe(
    map((user) => {
      if (user) {
        return resolveRedirect(user.role);
      }
      return true;
    }),
    catchError(() => of(true))
  );
};

export const redirectIfAuthenticatedGuard = guestGuard;

