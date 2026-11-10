import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminCredentialResetApprovalPageComponent } from './admin-credential-reset-approval-page.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { AdminResetApprovalView } from '../../../../auth/models/auth.models';

describe('AdminCredentialResetApprovalPageComponent', () => {
  let component: AdminCredentialResetApprovalPageComponent;
  let fixture: ComponentFixture<AdminCredentialResetApprovalPageComponent>;
  let authService: AuthService;

  const mockView: AdminResetApprovalView = {
    request_id: 'req-123',
    worker_id: 'wrk-123',
    worker_name: 'Budi Santoso',
    worker_phone: '6281234567890',
    request_type: 'RESET_PIN',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    is_approved: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCredentialResetApprovalPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? 'valid-test-token' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    jest.spyOn(authService, 'verifyResetRequestByAdmin').mockReturnValue(
      of({
        success: true,
        message: 'Permohonan diverifikasi',
        data: mockView,
      })
    );

    fixture = TestBed.createComponent(AdminCredentialResetApprovalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat komponen dan memverifikasi token dari query param', () => {
    expect(component).toBeTruthy();
    expect(authService.verifyResetRequestByAdmin).toHaveBeenCalledWith('valid-test-token');
    expect(component.approvalView()).toEqual(mockView);
    expect(component.loading()).toBe(false);
  });

  it('harus memanggil approveCredentialReset dan memperbarui state approveSuccess', () => {
    const mockApproveRes = {
      worker_name: 'Budi Santoso',
      worker_whatsapp_number: '6281234567890',
      whatsapp_share_url: 'https://wa.me/6281234567890',
      whatsapp_web_url: 'https://web.whatsapp.com/send',
      whatsapp_message: 'Halo Budi',
      execution_url: 'https://tuwaktu.com/reset-credential?token=exec-123',
      expires_in_minutes: 10,
    };

    jest.spyOn(authService, 'approveCredentialReset').mockReturnValue(
      of({
        success: true,
        message: 'Persetujuan sukses',
        data: mockApproveRes,
      })
    );

    component.approveRequest();
    expect(authService.approveCredentialReset).toHaveBeenCalledWith('valid-test-token');
    expect(component.approveSuccess()).toEqual(mockApproveRes);
    expect(component.isApproving()).toBe(false);
  });
});

