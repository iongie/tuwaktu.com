import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Component } from '@angular/core';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import {
  authGuard,
  isDashboardUrl,
  normalizeDashboardUrl,
} from './auth.guard';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('authGuard and Dashboard Routing Helpers', () => {
  let authService: AuthService;
  let router: Router;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([
          { path: 'login', component: DummyComponent },
          {
            path: 'dashboard',
            component: DummyComponent,
            canActivate: [authGuard],
            canActivateChild: [authGuard],
          },
          {
            path: 'dashboard/ringkasan',
            component: DummyComponent,
            canActivate: [authGuard],
          },
        ]),
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    authService.logout();
  });

  afterEach(() => {
    authService.logout();
  });

  describe('isDashboardUrl', () => {
    it('harus mengenali seluruh varian URL dasbor pekerja', () => {
      expect(isDashboardUrl('/dashboard')).toBe(true);
      expect(isDashboardUrl('/dashboard/')).toBe(true);
      expect(isDashboardUrl('/dashboard/ringkasan')).toBe(true);
      expect(isDashboardUrl('/dashboard/tarif-layanan')).toBe(true);
      expect(isDashboardUrl('/dashboard/integrasi-whatsapp?slug=budi-santoso')).toBe(true);
      expect(isDashboardUrl('/dashboard?slug=budi-santoso')).toBe(true);
      expect(isDashboardUrl('/dashboard#main')).toBe(true);
      expect(isDashboardUrl('/plan')).toBe(true);
      expect(isDashboardUrl('/boost')).toBe(true);
    });

    it('harus menolak URL non-dasbor atau eksternal', () => {
      expect(isDashboardUrl('/admin/workers')).toBe(false);
      expect(isDashboardUrl('/budi-santoso')).toBe(false);
      expect(isDashboardUrl('https://evil.com/dashboard')).toBe(false);
      expect(isDashboardUrl('//evil.com/dashboard')).toBe(false);
      expect(isDashboardUrl('/login')).toBe(false);
      expect(isDashboardUrl(null)).toBe(false);
      expect(isDashboardUrl(undefined)).toBe(false);
    });
  });

  describe('normalizeDashboardUrl', () => {
    it('harus menormalisasi root /dashboard ke /dashboard/ringkasan', () => {
      expect(normalizeDashboardUrl('/dashboard')).toBe('/dashboard/ringkasan');
      expect(normalizeDashboardUrl('/dashboard/')).toBe('/dashboard/ringkasan');
      expect(normalizeDashboardUrl('/dashboard?slug=budi-santoso')).toBe(
        '/dashboard/ringkasan?slug=budi-santoso'
      );
      expect(normalizeDashboardUrl('/dashboard/?slug=budi-santoso')).toBe(
        '/dashboard/ringkasan?slug=budi-santoso'
      );
      expect(normalizeDashboardUrl('/dashboard#section')).toBe(
        '/dashboard/ringkasan#section'
      );
      expect(normalizeDashboardUrl('/dashboard/tarif-layanan')).toBe(
        '/dashboard/tarif-layanan'
      );
      expect(normalizeDashboardUrl('/dashboard/tarif')).toBe(
        '/dashboard/tarif-layanan'
      );
      expect(normalizeDashboardUrl('/dashboard/logistik')).toBe(
        '/dashboard/logistik-radius'
      );
      expect(normalizeDashboardUrl('/dashboard/jadwal')).toBe(
        '/dashboard/kalender-slot'
      );
      expect(normalizeDashboardUrl('/dashboard/whatsapp')).toBe(
        '/dashboard/integrasi-whatsapp'
      );
      expect(normalizeDashboardUrl('/dashboard/profile?slug=budi-santoso')).toBe(
        '/dashboard/integrasi-whatsapp?slug=budi-santoso'
      );
      expect(normalizeDashboardUrl('/plan')).toBe('/dashboard/plan');
      expect(normalizeDashboardUrl('/boost')).toBe('/dashboard/boost');
    });
  });

  describe('authGuard execution', () => {
    it('harus mengalihkan ke /login dengan returnUrl default /dashboard/ringkasan jika pengguna belum login', async () => {
      authService.setSession(null);
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/dashboard/ringkasan' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menyimpan returnUrl sesuai target state.url saat mengalihkan ke /login', async () => {
      authService.setSession(null);
      const stateWithCustomUrl = {
        url: '/dashboard/tarif-layanan',
      } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, stateWithCustomUrl)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/dashboard/tarif-layanan' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menormalisasi target /dashboard menjadi /dashboard/ringkasan pada returnUrl', async () => {
      authService.setSession(null);
      const stateDashboardRoot = { url: '/dashboard' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, stateDashboardRoot)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/dashboard/ringkasan' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus mempertahankan query parameter saat mengalihkan pengunjung tanpa sesi ke /login', async () => {
      authService.setSession(null);
      const stateWithQuery = {
        url: '/dashboard/integrasi-whatsapp?slug=budi-santoso',
      } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, stateWithQuery)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: {
          returnUrl: '/dashboard/integrasi-whatsapp?slug=budi-santoso',
        },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus mengizinkan akses langsung jika pengguna sudah login di memori', () => {
      authService.setSession({
        id: 'worker-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );
      expect(result).toBe(true);
    });

    it('harus memverifikasi sesi via checkSession jika currentUser masih null dan mengizinkan jika sesi aktif', async () => {
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(
        of({
          id: 'worker-cookie',
          name: 'Sarah Melinda',
          slug: 'sarah-cleaning',
          role: 'worker',
        })
      );

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      expect(resolvedResult).toBe(true);
      expect(authService.checkSession).toHaveBeenCalled();
    });

    it('harus mengalihkan ke /login dengan returnUrl jika checkSession menghasilkan null', async () => {
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(of(null));

      const stateTarget = { url: '/dashboard/ringkasan' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, stateTarget)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/dashboard/ringkasan' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menangani error checkSession secara aman dengan mengalihkan ke /login', async () => {
      authService.setSession(null);
      jest
        .spyOn(authService, 'checkSession')
        .mockReturnValue(throwError(() => new Error('Network error')));

      const stateTarget = { url: '/dashboard/ringkasan' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, stateTarget)
      );
      const resolvedResult = isObservable(result)
        ? await firstValueFrom(result)
        : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/dashboard/ringkasan' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });
  });
});
