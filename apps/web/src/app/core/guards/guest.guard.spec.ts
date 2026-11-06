import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { Component } from '@angular/core';
import { firstValueFrom, isObservable, of, throwError, Observable } from 'rxjs';
import {
  guestGuard,
  redirectIfAuthenticatedGuard,
  resolveAuthenticatedRedirectUrl,
} from './guest.guard';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('guestGuard (RedirectIfAuthenticatedGuard)', () => {
  let authService: AuthService;
  let router: Router;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([
          { path: 'login', component: DummyComponent, canActivate: [guestGuard] },
          { path: 'admin/workers', component: DummyComponent },
          { path: 'dashboard/ringkasan', component: DummyComponent },
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

  describe('resolveAuthenticatedRedirectUrl', () => {
    it('harus mengarahkan role ADMIN ke /admin/workers', () => {
      expect(resolveAuthenticatedRedirectUrl('ADMIN')).toBe('/admin/workers');
      expect(resolveAuthenticatedRedirectUrl('admin')).toBe('/admin/workers');
    });

    it('harus mengarahkan role WORKER atau nilai default ke /dashboard/ringkasan', () => {
      expect(resolveAuthenticatedRedirectUrl('WORKER')).toBe('/dashboard/ringkasan');
      expect(resolveAuthenticatedRedirectUrl('worker')).toBe('/dashboard/ringkasan');
      expect(resolveAuthenticatedRedirectUrl(null)).toBe('/dashboard/ringkasan');
      expect(resolveAuthenticatedRedirectUrl(undefined)).toBe('/dashboard/ringkasan');
    });
  });

  describe('guestGuard execution', () => {
    it('harus mengarahkan pengguna yang sudah login dengan peran WORKER ke /dashboard/ringkasan', () => {
      authService.setSession({
        id: 'worker-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(false);
      const expectedUrlTree = router.createUrlTree(['/dashboard/ringkasan']);
      expect(result).toEqual(expectedUrlTree);
    });

    it('harus mengarahkan pengguna yang sudah login dengan peran ADMIN ke /admin/workers', () => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(false);
      const expectedUrlTree = router.createUrlTree(['/admin/workers']);
      expect(result).toEqual(expectedUrlTree);
    });

    it('harus mengizinkan akses ke /login secara sinkron jika isInitialized sudah true dan pengguna adalah tamu', () => {
      authService.setSession(null);
      authService.isInitialized.set(true);
      const checkSpy = jest.spyOn(authService, 'checkAuthStatus');

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(false);
      expect(result).toBe(true);
      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('harus menahan eksekusi guard via Observable jika isInitialized bernilai false dan mengalihkan jika ada sesi aktif', async () => {
      authService.setSession(null);
      expect(authService.isInitialized()).toBe(false);

      const checkSpy = jest.spyOn(authService, 'checkAuthStatus').mockReturnValue(
        of({
          id: 'worker-hydrated',
          name: 'Sarah Melinda',
          slug: 'sarah-cleaning',
          role: 'worker',
        })
      );

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(true);
      const resolved = await firstValueFrom(result as Observable<unknown>);
      const expectedUrlTree = router.createUrlTree(['/dashboard/ringkasan']);
      expect(resolved).toEqual(expectedUrlTree);
      expect(checkSpy).toHaveBeenCalled();
    });

    it('harus mengizinkan tamu mengakses /login jika checkAuthStatus mengembalikan null saat isInitialized false', async () => {
      authService.setSession(null);
      expect(authService.isInitialized()).toBe(false);

      jest.spyOn(authService, 'checkAuthStatus').mockReturnValue(of(null));

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(true);
      const resolved = await firstValueFrom(result as Observable<unknown>);
      expect(resolved).toBe(true);
    });

    it('harus mengizinkan tamu mengakses /login jika checkAuthStatus melempar error', async () => {
      authService.setSession(null);
      expect(authService.isInitialized()).toBe(false);

      jest.spyOn(authService, 'checkAuthStatus').mockReturnValue(throwError(() => new Error('Koneksi terputus')));

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(true);
      const resolved = await firstValueFrom(result as Observable<unknown>);
      expect(resolved).toBe(true);
    });

    it('harus memastikan alias redirectIfAuthenticatedGuard identik dengan guestGuard', () => {
      expect(redirectIfAuthenticatedGuard).toBe(guestGuard);
    });
  });
});

