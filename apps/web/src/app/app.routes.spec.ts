import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_ENVIRONMENT } from '../environments/environment.model';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
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
  });
});
