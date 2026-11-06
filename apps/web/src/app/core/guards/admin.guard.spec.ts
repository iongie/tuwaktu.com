import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import {
  adminGuard,
  isAdminUrl,
  normalizeAdminUrl,
  sanitizeReturnUrl,
} from './admin.guard';
import { AuthService } from '../../features/auth/services/auth.service';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('adminGuard and Routing Security Helpers', () => {
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
          { path: 'dashboard', component: DummyComponent },
          { path: 'admin/workers', component: DummyComponent, canActivate: [adminGuard] },
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

  describe('sanitizeReturnUrl', () => {
    it('harus menolak URL eksternal atau format tidak valid', () => {
      expect(sanitizeReturnUrl(null)).toBeNull();
      expect(sanitizeReturnUrl(undefined)).toBeNull();
      expect(sanitizeReturnUrl('')).toBeNull();
      expect(sanitizeReturnUrl('   ')).toBeNull();
      expect(sanitizeReturnUrl('https://evil.com')).toBeNull();
      expect(sanitizeReturnUrl('http://evil.com/admin')).toBeNull();
      expect(sanitizeReturnUrl('//evil.com/admin')).toBeNull();
      expect(sanitizeReturnUrl('/admin\\evil.com')).toBeNull();
      expect(sanitizeReturnUrl('/login')).toBeNull();
      expect(sanitizeReturnUrl('/login?returnUrl=/admin')).toBeNull();
    });

    it('harus menerima URL internal yang valid', () => {
      expect(sanitizeReturnUrl('/admin')).toBe('/admin');
      expect(sanitizeReturnUrl('/admin/workers')).toBe('/admin/workers');
      expect(sanitizeReturnUrl('/admin/workers?status=PENDING')).toBe('/admin/workers?status=PENDING');
      expect(sanitizeReturnUrl('/dashboard')).toBe('/dashboard');
    });
  });

  describe('isAdminUrl', () => {
    it('harus mengenali seluruh varian URL admin', () => {
      expect(isAdminUrl('/admin')).toBe(true);
      expect(isAdminUrl('/admin/')).toBe(true);
      expect(isAdminUrl('/admin/workers')).toBe(true);
      expect(isAdminUrl('/admin/workers?status=PENDING')).toBe(true);
      expect(isAdminUrl('/admin?tab=overview')).toBe(true);
      expect(isAdminUrl('/admin#main')).toBe(true);
    });

    it('harus menolak URL non-admin meskipun memuat kata admin', () => {
      expect(isAdminUrl('/dashboard')).toBe(false);
      expect(isAdminUrl('/dashboard?ref=/admin')).toBe(false);
      expect(isAdminUrl('/worker/admin-specialty')).toBe(false);
      expect(isAdminUrl('https://evil.com/admin')).toBe(false);
      expect(isAdminUrl('//evil.com/admin')).toBe(false);
      expect(isAdminUrl(null)).toBe(false);
    });
  });

  describe('normalizeAdminUrl', () => {
    it('harus menormalisasi root /admin ke /admin/workers', () => {
      expect(normalizeAdminUrl('/admin')).toBe('/admin/workers');
      expect(normalizeAdminUrl('/admin/')).toBe('/admin/workers');
      expect(normalizeAdminUrl('/admin?status=PENDING')).toBe('/admin/workers?status=PENDING');
      expect(normalizeAdminUrl('/admin/?status=PENDING')).toBe('/admin/workers?status=PENDING');
      expect(normalizeAdminUrl('/admin#section')).toBe('/admin/workers#section');
      expect(normalizeAdminUrl('/admin/workers')).toBe('/admin/workers');
      expect(normalizeAdminUrl('/admin/workers?status=SUSPENDED')).toBe('/admin/workers?status=SUSPENDED');
    });
  });

  describe('adminGuard execution', () => {
    it('harus mengalihkan ke /login dengan returnUrl default jika pengguna belum login', async () => {
      authService.setSession(null);
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menyimpan returnUrl sesuai target state.url saat mengalihkan ke /login', async () => {
      authService.setSession(null);
      const stateWithCustomUrl = { url: '/admin/workers?status=PENDING' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, stateWithCustomUrl));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers?status=PENDING' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menormalisasi target /admin menjadi /admin/workers pada returnUrl', async () => {
      authService.setSession(null);
      const stateAdminRoot = { url: '/admin' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, stateAdminRoot));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menormalisasi target /admin?status=SUSPENDED menjadi /admin/workers?status=SUSPENDED', async () => {
      authService.setSession(null);
      const stateAdminQuery = { url: '/admin?status=SUSPENDED' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, stateAdminQuery));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers?status=SUSPENDED' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus mengalihkan ke /dashboard jika pengguna login sebagai WORKER', () => {
      authService.setSession({
        id: 'worker-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      const expectedUrlTree = router.createUrlTree(['/dashboard']);
      expect(result).toEqual(expectedUrlTree);
    });

    it('harus mengizinkan akses jika pengguna login dengan wewenang ADMIN', () => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Admin',
        slug: 'admin',
        role: 'ADMIN',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('harus memverifikasi sesi via checkSession jika currentUser di memori masih null dan mengizinkan admin', async () => {
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(
        of({
          id: 'admin-cookie',
          name: 'Super Administrator',
          slug: 'admin',
          role: 'ADMIN',
        })
      );

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      expect(resolvedResult).toBe(true);
      expect(authService.checkSession).toHaveBeenCalled();
    });

    it('harus memverifikasi sesi via checkSession jika currentUser null dan mengalihkan pekerja ke /dashboard', async () => {
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(
        of({
          id: 'worker-cookie',
          name: 'Mitra Kerja',
          slug: 'mitra-kerja',
          role: 'worker',
        })
      );

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/dashboard']);
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus mengalihkan ke /login dengan returnUrl jika checkSession menghasilkan null', async () => {
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(of(null));

      const stateTarget = { url: '/admin/workers' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, stateTarget));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus menangani error checkSession secara aman dengan mengalihkan ke /login', async () => {
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(throwError(() => new Error('Network error')));

      const stateTarget = { url: '/admin/workers' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, stateTarget));
      const resolvedResult = isObservable(result) ? await firstValueFrom(result) : result;
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers' },
      });
      expect(resolvedResult).toEqual(expectedUrlTree);
    });

    it('harus mengalihkan ke /login secara sinkron tanpa memanggil checkAuthStatus jika isInitialized sudah true dan currentUser null', () => {
      authService.setSession(null);
      authService.isInitialized.set(true);
      const checkSpy = jest.spyOn(authService, 'checkAuthStatus');

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(false);
      const expectedUrlTree = router.createUrlTree(['/login'], {
        queryParams: { returnUrl: '/admin/workers' },
      });
      expect(result).toEqual(expectedUrlTree);
      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('harus menahan eksekusi adminGuard via Observable checkAuthStatus jika isInitialized bernilai false', async () => {
      authService.setSession(null);
      expect(authService.isInitialized()).toBe(false);
      const checkSpy = jest.spyOn(authService, 'checkAuthStatus').mockReturnValue(
        of({
          id: 'admin-delayed',
          name: 'Super Admin',
          slug: 'admin',
          role: 'ADMIN',
        })
      );

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));

      expect(isObservable(result)).toBe(true);
      const resolved = await firstValueFrom(result as Observable<unknown>);
      expect(resolved).toBe(true);
      expect(checkSpy).toHaveBeenCalled();
    });
  });
});



