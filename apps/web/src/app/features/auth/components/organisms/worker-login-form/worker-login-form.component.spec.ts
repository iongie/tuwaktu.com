import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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
        provideRouter([{ path: 'dashboard', component: class DummyDashboardComponent {} }]),
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

  it('harus memicu pengiriman magic link WhatsApp secara aman', async () => {
    const magicSpy = jest.spyOn(authService, 'sendMagicLink').mockResolvedValue(true);
    component.waNumber = '081288992211';
    await component.triggerMagicLink();
    expect(magicSpy).toHaveBeenCalledWith('081288992211');
  });
});
