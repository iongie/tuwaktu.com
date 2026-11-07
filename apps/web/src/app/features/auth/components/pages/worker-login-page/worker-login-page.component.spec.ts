import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkerLoginPageComponent } from './worker-login-page.component';
import { AuthService } from '../../../services/auth.service';

describe('WorkerLoginPageComponent', () => {
  let fixture: ComponentFixture<WorkerLoginPageComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerLoginPageComponent],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(WorkerLoginPageComponent);
  });

  it('harus merender skeleton loader pemuatan sesi saat isInitialized bernilai false', () => {
    authService.isInitialized.set(false);
    fixture.detectChanges();

    const loader = fixture.nativeElement.querySelector('[data-testid="session-initializing-loader"]');
    expect(loader).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Memverifikasi Sesi...');
    expect(fixture.nativeElement.textContent).not.toContain('Masuk ke Konsol Mandiri');
  });

  it('harus merender form login lengkap saat isInitialized bernilai true', () => {
    authService.isInitialized.set(true);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Akses Langsung Mitra Mandiri.');
    expect(text).toContain('PORTAL AKSES PEKERJA MANDIRI');
    expect(text).toContain('STATUS SISTEM DISPATCH');
    expect(text).toContain('Keamanan Akses Terenkripsi');
    expect(text).toContain('Sinkronisasi Slot Kalender Seketika');
    expect(text).toContain('Jalur Cepat WhatsApp Dispatch');
    expect(text).toContain('Masuk ke Konsol Mandiri');
  });
});
