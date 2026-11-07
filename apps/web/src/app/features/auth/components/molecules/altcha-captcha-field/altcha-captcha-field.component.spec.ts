import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AltchaCaptchaFieldComponent } from './altcha-captcha-field.component';
import { AuthService } from '../../../services/auth.service';
import { AltchaChallenge } from '../../../models/auth.models';

describe('AltchaCaptchaFieldComponent', () => {
  let component: AltchaCaptchaFieldComponent;
  let fixture: ComponentFixture<AltchaCaptchaFieldComponent>;
  let authService: AuthService;

  const mockChallenge: AltchaChallenge = {
    algorithm: 'SHA-256',
    challenge: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    maxnumber: 10,
    salt: 'test',
    signature: 'sig-valid-123',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltchaCaptchaFieldComponent],
      providers: [AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(AltchaCaptchaFieldComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('harus terinisialisasi dengan status idle', () => {
    expect(component).toBeTruthy();
    expect(component.status()).toBe('idle');
    expect(fixture.nativeElement.textContent).toContain('Saya bukan robot');
  });

  it('harus berhasil menyelesaikan verifikasi ALTCHA dan memancarkan payload', async () => {
    jest.spyOn(authService, 'fetchAltchaChallenge').mockReturnValue(of(mockChallenge));
    jest.spyOn(authService, 'solveAltchaChallenge').mockResolvedValue('encoded-altcha-payload');

    let emitted = '';
    component.verifiedPayload.subscribe((val) => {
      emitted = val;
    });

    await component.startVerification();
    fixture.detectChanges();

    expect(component.status()).toBe('verified');
    expect(emitted).toBe('encoded-altcha-payload');
    expect(fixture.nativeElement.textContent).toContain('Perangkat terverifikasi aman');
  });

  it('harus menampilkan state error dan tombol Muat Ulang jika gagal mengambil tantangan', async () => {
    jest.spyOn(authService, 'fetchAltchaChallenge').mockReturnValue(of(null));

    await component.startVerification();
    fixture.detectChanges();

    expect(component.status()).toBe('error');
    expect(component.errorMessage()).toContain('Server tantangan tidak merespons');
    const retryBtn = fixture.nativeElement.querySelector('[data-testid="altcha-retry-button"]');
    expect(retryBtn).toBeTruthy();
  });

  it('harus menampilkan state error jika terjadi exception saat mengambil tantangan', async () => {
    jest
      .spyOn(authService, 'fetchAltchaChallenge')
      .mockReturnValue(throwError(() => new Error('network error')));

    await component.startVerification();
    fixture.detectChanges();

    expect(component.status()).toBe('error');
    expect(component.errorMessage()).toContain('Terjadi gangguan jaringan');
  });

  it('harus mereset status kembali ke idle saat reset() dipanggil', async () => {
    jest.spyOn(authService, 'fetchAltchaChallenge').mockReturnValue(of(mockChallenge));
    jest.spyOn(authService, 'solveAltchaChallenge').mockResolvedValue('encoded-altcha-payload');

    await component.startVerification();
    expect(component.status()).toBe('verified');

    component.reset();
    fixture.detectChanges();
    expect(component.status()).toBe('idle');
    expect(component.currentPayload()).toBe('');
  });
});
