import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { WorkerLoginFormComponent } from './worker-login-form.component';
import { AuthService } from '../../../services/auth.service';

describe('WorkerLoginFormComponent', () => {
  let component: WorkerLoginFormComponent;
  let fixture: ComponentFixture<WorkerLoginFormComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerLoginFormComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: class DummyDashboardComponent {} },
          { path: 'admin/workers', component: class DummyAdminComponent {} },
        ]),
        AuthService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerLoginFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('harus menginisialisasi form login dengan field kosong tanpa data fiktif', () => {
    expect(component).toBeTruthy();
    expect(component.waNumber).toBe('');
    expect(component.workerId).toBe('');
    expect(component.securityPin).toBe('');
    expect(component.rememberDevice).toBe(false);
  });

  it('harus berganti metode masuk antara WhatsApp dan ID Praktisi', () => {
    expect(component.activeMethod()).toBe('wa');
    component.setMethod('id');
    fixture.detectChanges();
    expect(component.activeMethod()).toBe('id');
  });

  it('harus mengubah visibilitas PIN saat toggle ditekan', () => {
    expect(component.showPin()).toBe(false);
    component.togglePinVisibility();
    expect(component.showPin()).toBe(true);
    component.togglePinVisibility();
    expect(component.showPin()).toBe(false);
  });

  it('harus memvalidasi nomor WhatsApp dan PIN saat submit metode wa', () => {
    component.waNumber = '123';
    component.handleLoginSubmit();
    fixture.detectChanges();

    expect(component.loginError()).toContain('WhatsApp terdaftar');
  });

  it('harus memvalidasi ID Praktisi saat submit metode id dengan data kosong', () => {
    component.setMethod('id');
    component.workerId = '';
    component.securityPin = '123456';
    component.handleLoginSubmit();
    fixture.detectChanges();

    expect(component.loginError()).toContain('ID Praktisi');
  });

  it('harus menampilkan panduan reset saat showResetInfo dipanggil', () => {
    component.showResetInfo();
    expect(component.loginError()).toContain('mereset nomor atau PIN');
  });

  it('harus berhasil login dan berpindah ke dasbor jika data valid', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'usr-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });
      return of({ success: true });
    });

    component.waNumber = '081288992211';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    expect(component.loginError()).toBe('');
    expect(component.loginSuccess()).toContain('Otentikasi berhasil');

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    jest.useRealTimers();
  });

  it('harus berhasil login dan berpindah ke panel admin jika akun berwewenang ADMIN', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      return of({ success: true });
    });

    component.setMethod('id');
    component.workerId = 'admin@tuwaktu.com';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    expect(component.loginError()).toBe('');
    expect(component.loginSuccess()).toContain('Otentikasi berhasil');

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/workers']);
    jest.useRealTimers();
  });

  it('harus memicu pengiriman magic link WhatsApp secara aman', async () => {
    const magicSpy = jest.spyOn(authService, 'sendMagicLink').mockResolvedValue(true);
    component.waNumber = '081288992211';
    await component.triggerMagicLink();
    expect(magicSpy).toHaveBeenCalledWith('081288992211');
  });

  it('harus menampilkan banner peringatan jika returnUrl mengarah ke panel admin', () => {
    component.returnUrl.set('/admin/workers');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('#adminAuthNoticeBanner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Akses Panel Admin Memerlukan Autentikasi');
  });

  it('harus menampilkan banner peringatan dasbor jika returnUrl mengarah ke konsol dasbor', () => {
    component.returnUrl.set('/dashboard/tarif-layanan');
    fixture.detectChanges();

    const adminBanner = fixture.nativeElement.querySelector('#adminAuthNoticeBanner');
    const dashboardBanner = fixture.nativeElement.querySelector('#dashboardAuthNoticeBanner');
    expect(adminBanner).toBeFalsy();
    expect(dashboardBanner).toBeTruthy();
    expect(dashboardBanner.textContent).toContain('Akses Konsol Dasbor Memerlukan Autentikasi');
  });

  it('harus mengarahkan pekerja ke returnUrl dasbor spesifik setelah login berhasil', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'worker-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/dashboard/ringkasan');
    component.waNumber = '081288992211';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/ringkasan']);
    jest.useRealTimers();
  });

  it('tidak boleh menampilkan banner admin jika path bukan admin murni (misal query param ref=/admin)', () => {
    component.returnUrl.set('/dashboard?ref=/admin');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('#adminAuthNoticeBanner');
    expect(banner).toBeFalsy();
    expect(component.requiresAdminLogin()).toBe(false);
    expect(component.requiresDashboardLogin()).toBe(true);
  });

  it('harus menolak returnUrl eksternal jahat dan mengabaikannya', () => {
    component.returnUrl.set('https://evil.com/admin');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('#adminAuthNoticeBanner');
    expect(banner).toBeFalsy();
    expect(component.requiresAdminLogin()).toBe(false);
  });

  it('harus mengarahkan admin ke returnUrl spesifik setelah login berhasil', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/admin/workers');
    component.setMethod('id');
    component.workerId = 'admin@tuwaktu.com';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/workers']);
    jest.useRealTimers();
  });

  it('harus menormalisasi returnUrl /admin menjadi /admin/workers saat admin login', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/admin');
    component.setMethod('id');
    component.workerId = 'admin@tuwaktu.com';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/workers']);
    jest.useRealTimers();
  });

  it('harus mengarahkan admin ke returnUrl dasbor yang dinormalisasi jika admin mengakses rute dasbor sebelum login', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/dashboard');
    component.setMethod('id');
    component.workerId = 'admin@tuwaktu.com';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/ringkasan']);
    jest.useRealTimers();
  });

  it('harus mengarahkan admin ke /admin/workers jika returnUrl bukan rute admin maupun dasbor (misal /budi-santoso)', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/budi-santoso');
    component.setMethod('id');
    component.workerId = 'admin@tuwaktu.com';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/workers']);
    jest.useRealTimers();
  });

  it('harus menolak akses admin dan mengarahkan pekerja biasa ke /dashboard meskipun returnUrl menuju admin', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'worker-1',
        name: 'Budi Santoso',
        slug: 'budi-santoso',
        role: 'worker',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/admin/workers');
    component.waNumber = '081288992211';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    jest.useRealTimers();
  });

  it('harus menggunakan navigateByUrl jika destination memiliki query parameter', () => {
    jest.useFakeTimers();
    const navigateByUrlSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/admin/workers?status=SUSPENDED');
    component.setMethod('id');
    component.workerId = 'admin@tuwaktu.com';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/admin/workers?status=SUSPENDED');
    jest.useRealTimers();
  });

  it('harus mempertahankan query parameter kompleks saat mengalihkan pekerja ke returnUrl dasbor setelah login', () => {
    jest.useFakeTimers();
    const navigateByUrlSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    jest.spyOn(authService, 'login').mockImplementation(() => {
      authService.setSession({
        id: 'worker-1',
        name: 'Sarah Melinda',
        slug: 'sarah-cleaning',
        role: 'worker',
      });
      return of({ success: true });
    });

    component.returnUrl.set('/dashboard/integrasi-whatsapp?slug=sarah-cleaning&tab=template');
    component.waNumber = '081288992211';
    component.securityPin = '123456';

    component.handleLoginSubmit();
    fixture.detectChanges();

    jest.runAllTimers();
    expect(navigateByUrlSpy).toHaveBeenCalledWith(
      '/dashboard/integrasi-whatsapp?slug=sarah-cleaning&tab=template'
    );
    jest.useRealTimers();
  });
});
