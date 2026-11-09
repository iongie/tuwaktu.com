import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CredentialResetModalComponent } from './credential-reset-modal.component';
import { AuthService } from '../../../services/auth.service';

describe('CredentialResetModalComponent', () => {
  let component: CredentialResetModalComponent;
  let fixture: ComponentFixture<CredentialResetModalComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialResetModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(CredentialResetModalComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('harus membuat komponen secara sukses', () => {
    expect(component).toBeTruthy();
  });

  it('harus berganti jenis permohonan saat selectType dipanggil', () => {
    expect(component.selectedType()).toBe('RESET_PIN');
    component.selectType('CHANGE_PHONE');
    expect(component.selectedType()).toBe('CHANGE_PHONE');
    component.selectType('RESET_PIN');
    expect(component.selectedType()).toBe('RESET_PIN');
  });

  it('harus memvalidasi nomor dan altcha sebelum submit', () => {
    component.waNumber.set('081234');
    expect(component.isFormValid()).toBe(false);

    component.waNumber.set('081234567890');
    expect(component.isFormValid()).toBe(false);

    component.onAltchaVerified('valid-altcha-payload');
    expect(component.isFormValid()).toBe(true);
  });

  it('harus memanggil authService.requestCredentialReset dan menampilkan data sukses', () => {
    const mockResponse = {
      worker_name: 'Budi Teknisi',
      phone_number: '6281234567890',
      admin_whatsapp_number: '6281999999999',
      whatsapp_share_url: 'https://wa.me/6281999999999',
      whatsapp_web_url: 'https://web.whatsapp.com/send?phone=6281999999999',
      whatsapp_message: 'Halo Admin',
      expires_in_minutes: 15,
    };

    jest.spyOn(authService, 'requestCredentialReset').mockReturnValue(
      of({
        success: true,
        message: 'Permohonan reset kredensial berhasil dibuat',
        data: mockResponse,
      })
    );

    component.waNumber.set('081234567890');
    component.altchaPayload.set('test-altcha');
    component.submitResetRequest();

    expect(authService.requestCredentialReset).toHaveBeenCalled();
    expect(component.successData()).toEqual(mockResponse);
  });

  it('harus memancarkan closed event saat closeModal dipanggil', () => {
    const closeSpy = jest.spyOn(component.closed, 'emit');
    component.closeModal();
    expect(closeSpy).toHaveBeenCalled();
  });
});

