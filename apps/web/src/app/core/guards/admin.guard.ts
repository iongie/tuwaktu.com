import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Route guard yang memastikan rute hanya dapat diakses oleh akun dengan wewenang ADMIN.
 * Memeriksa status sesi dari sinyal memori runtime AuthService, atau memvalidasi via checkSession() (GET /api/v1/auth/me) jika sinyal memori belum ter-hydrate.
 */
export const adminGuard: CanActivateFn = ():
  | boolean
  | UrlTree
  | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

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
        return router.createUrlTree(['/login']);
      }
      const role = (user.role || '').toUpperCase();
      if (role === 'ADMIN') {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    })
  );
};

