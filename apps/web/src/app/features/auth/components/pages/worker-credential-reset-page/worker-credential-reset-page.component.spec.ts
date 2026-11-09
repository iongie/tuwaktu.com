import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { WorkerCredentialResetPageComponent } from './worker-credential-reset-page.component';
import { AuthService } from '../../../services/auth.service';

describe('WorkerCredentialResetPageComponent', () => {
  let component: WorkerCredentialResetPageComponent;
  let fixture: ComponentFixture<WorkerCredentialResetPageComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerCredentialResetPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: class {} }]),
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? 'valid-exec-token' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(WorkerCredentialResetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat komponen dan mendeteksi token valid', () => {
    expect(component).toBeTruthy();
    expect(component.hasToken()).toBe(true);
  });

  it('harus memvalidasi kecocokan PIN dan Altcha', () => {
    component.registeredPhone = '081234567890';
    component.newPin = '852963';
    component.confirmPin = '852960'; // Tidak cocok
    expect(component.isFormValid()).toBe(false);

    component.confirmPin = '852963'; // Cocok tapi altcha belum
    expect(component.isFormValid()).toBe(false);

    component.onAltchaVerified('valid-altcha');
    expect(component.isFormValid()).toBe(true);
  });

  it('harus memanggil authService.executeCredentialReset saat submit sukses', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(authService, 'executeCredentialReset').mockReturnValue(
      of({
        success: true,
        message: 'Kredensial akun berhasil diperbarui',
      })
    );

    component.registeredPhone = '081234567890';
    component.newPin = '852963';
    component.confirmPin = '852963';
    component.onAltchaVerified('valid-altcha');

    component.handleResetSubmit();

    expect(authService.executeCredentialReset).toHaveBeenCalled();
    expect(component.successMessage()).toContain('Kredensial akun berhasil diperbarui');

    jest.advanceTimersByTime(2000);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    jest.useRealTimers();
  });
});
