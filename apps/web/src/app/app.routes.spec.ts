import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { APP_ENVIRONMENT } from '../environments/environment.model';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { AuthService } from './features/auth/services/auth.service';

describe('appRoutes', () => {
  it('harus memuat HomePageComponent pada rute root', () => {
    const rootRoute = appRoutes.find((r) => r.path === '');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.loadComponent).toBeDefined();
  });

  it('harus memuat WorkerBookingPageComponent pada rute dinamis :slug', () => {
    const slugRoute = appRoutes.find((r) => r.path === ':slug');
    expect(slugRoute).toBeDefined();
    expect(slugRoute?.loadComponent).toBeDefined();
  });

  it('harus mengarahkan rute dashboard/profile ke dashboard/integrasi-whatsapp secara deklaratif', () => {
    const profileRoute = appRoutes.find((r) => r.path === 'dashboard/profile');
    expect(profileRoute).toBeDefined();
    expect(profileRoute?.redirectTo).toBe('dashboard/integrasi-whatsapp');
  });

  it('harus memiliki modul dasbor terkonfigurasi dengan child routes yang tepat', () => {
    const dashboardRoute = appRoutes.find((r) => r.path === 'dashboard');
    expect(dashboardRoute).toBeDefined();
    expect(dashboardRoute?.children).toBeDefined();

    const children = dashboardRoute?.children ?? [];

    const defaultChild = children.find((c) => c.path === '' && c.pathMatch === 'full');
    expect(defaultChild?.redirectTo).toBe('ringkasan');

    const profileChild = children.find((c) => c.path === 'profile');
    expect(profileChild?.redirectTo).toBe('integrasi-whatsapp');

    const whatsappAlias = children.find((c) => c.path === 'whatsapp');
    expect(whatsappAlias?.redirectTo).toBe('integrasi-whatsapp');

    const whatsappPage = children.find((c) => c.path === 'integrasi-whatsapp');
    expect(whatsappPage?.loadComponent).toBeDefined();

    const summaryPage = children.find((c) => c.path === 'ringkasan');
    expect(summaryPage?.loadComponent).toBeDefined();
  });

  it('harus memiliki rute register dan login pekerja mandiri yang terdefinisi', () => {
    const registerRoute = appRoutes.find((r) => r.path === 'register');
    expect(registerRoute).toBeDefined();
    expect(registerRoute?.loadComponent).toBeDefined();

    const daftarRoute = appRoutes.find((r) => r.path === 'daftar');
    expect(daftarRoute).toBeDefined();
    expect(daftarRoute?.redirectTo).toBe('register');

    const loginRoute = appRoutes.find((r) => r.path === 'login');
    expect(loginRoute).toBeDefined();
    expect(loginRoute?.loadComponent).toBeDefined();

    const masukRoute = appRoutes.find((r) => r.path === 'masuk');
    expect(masukRoute).toBeDefined();
    expect(masukRoute?.redirectTo).toBe('login');
  });

  it('harus memiliki konfigurasi rute admin terproteksi canActivate dan canActivateChild', () => {
    const adminRoute = appRoutes.find((r) => r.path === 'admin');
    expect(adminRoute).toBeDefined();
    expect(adminRoute?.canActivate).toBeDefined();
    expect(adminRoute?.canActivateChild).toBeDefined();
    expect(adminRoute?.children).toBeDefined();

    const children = adminRoute?.children ?? [];
    const defaultChild = children.find((c) => c.path === '' && c.pathMatch === 'full');
    expect(defaultChild?.redirectTo).toBe('workers');

    const workersChild = children.find((c) => c.path === 'workers');
    expect(workersChild?.loadComponent).toBeDefined();
  });

  describe('Router Navigation Redirections', () => {
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        providers: [
          provideRouter(appRoutes),
          provideLocationMocks(),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: APP_ENVIRONMENT, useValue: environment },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
    });

    it('harus menavigasi ke /dashboard/integrasi-whatsapp saat mengakses /dashboard/profile', async () => {
      const navigated = await router.navigateByUrl('/dashboard/profile');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/dashboard/integrasi-whatsapp');
    });

    it('harus mempertahankan query parameter slug saat redirect dari /dashboard/profile', async () => {
      const navigated = await router.navigateByUrl('/dashboard/profile?slug=budi-santoso');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/dashboard/integrasi-whatsapp?slug=budi-santoso');
    });

    it('harus mengarahkan root /dashboard ke /dashboard/ringkasan', async () => {
      const navigated = await router.navigateByUrl('/dashboard');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/dashboard/ringkasan');
    });

    it('harus mengarahkan alias /daftar ke /register', async () => {
      const navigated = await router.navigateByUrl('/daftar');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/register');
    });

    it('harus mengarahkan alias /masuk ke /login', async () => {
      const navigated = await router.navigateByUrl('/masuk');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/login');
    });

    it('harus mengarahkan pengunjung tanpa sesi ke /login saat mengakses /admin/workers', async () => {
      const authService = TestBed.inject(AuthService);
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(of(null));
      const navigated = await router.navigateByUrl('/admin/workers');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/login?returnUrl=%2Fadmin%2Fworkers');
    });

    it('harus mengarahkan pengunjung tanpa sesi ke /login saat mengakses /admin', async () => {
      const authService = TestBed.inject(AuthService);
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(of(null));
      const navigated = await router.navigateByUrl('/admin');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/login?returnUrl=%2Fadmin%2Fworkers');
    });

    it('harus mempertahankan query parameter saat pengunjung tanpa sesi mengakses /admin?status=SUSPENDED', async () => {
      const authService = TestBed.inject(AuthService);
      authService.setSession(null);
      jest.spyOn(authService, 'checkSession').mockReturnValue(of(null));
      const navigated = await router.navigateByUrl('/admin?status=SUSPENDED');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/login?returnUrl=%2Fadmin%2Fworkers%3Fstatus%3DSUSPENDED');
    });

    it('harus mengalihkan akun non-admin ke dasbor saat mengakses /admin/workers', async () => {
      const authService = TestBed.inject(AuthService);
      authService.setSession({
        id: 'worker-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });
      const navigated = await router.navigateByUrl('/admin/workers');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/dashboard/ringkasan');
    });

    it('harus mengizinkan akun ADMIN mengakses /admin/workers', async () => {
      const authService = TestBed.inject(AuthService);
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      const navigated = await router.navigateByUrl('/admin/workers');
      expect(navigated).toBe(true);
      expect(router.url).toBe('/admin/workers');
    });
  });
});
