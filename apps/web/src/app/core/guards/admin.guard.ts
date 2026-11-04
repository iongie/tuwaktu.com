import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Route guard yang memastikan rute hanya dapat diakses oleh akun dengan wewenang ADMIN.
 * Jika pengguna belum terautentikasi atau bukan admin, akan dialihkan ke halaman login atau dasbor kerja.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/login']);
  }

  const role = (currentUser.role || '').toUpperCase();
  if (role === 'ADMIN') {
    return true;
  }

  // Jika pekerja biasa mencoba mengakses panel admin, arahkan ke dasbor pekerja
  return router.createUrlTree(['/dashboard']);
};

