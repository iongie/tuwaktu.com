import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../../features/auth/services/auth.service';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('adminGuard', () => {
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

  it('harus mengalihkan ke /login jika pengguna belum login', () => {
    authService.setSession(null);
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    const expectedUrlTree = router.createUrlTree(['/login']);
    expect(result).toEqual(expectedUrlTree);
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
});


