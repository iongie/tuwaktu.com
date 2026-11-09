import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WorkerRegisterFormComponent } from './worker-register-form.component';
import { AuthService } from '../../../services/auth.service';

describe('WorkerRegisterFormComponent', () => {
  let component: WorkerRegisterFormComponent;
  let fixture: ComponentFixture<WorkerRegisterFormComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerRegisterFormComponent],
      providers: [
        provideRouter([
          { path: 'dashboard/ringkasan', component: class DummyDashboardComponent {} },
          { path: 'dashboard', component: class DummyDashboardComponent {} },
        ]),
        AuthService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerRegisterFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.onAltchaVerified('mock-altcha-payload');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('harus membuat instance formulir registrasi dengan nilai awal bersih tanpa data fiktif', () => {
    expect(component).toBeTruthy();
    expect(component.fullName).toBe('');
    expect(component.waNumber).toBe('');
    expect(component.basecamp).toBe('');
    expect(component.customSlug).toBe('');
    expect(component.workerPin).toBe('');
    expect(component.workerPinConfirm).toBe('');
    expect(component.doctrineAgreement).toBe(false);
  });

  it('harus secara otomatis men-generate custom slug dari nama lengkap jika belum diubah manual', () => {
    component.onFullNameChange('Sarah Melinda');
    expect(component.customSlug).toBe('sarah-melinda');
    expect(component.slugValidation().isValid).toBe(true);
  });

  it('harus mempertahankan slug kustom jika pengguna mengubahnya secara manual', () => {
    component.onFullNameChange('Sarah Melinda');
    component.onSlugChange('studio-bersih');
    component.onFullNameChange('Sarah Melinda Update');
    expect(component.customSlug).toBe('studio-bersih');
  });

  it('harus memvalidasi dan menampilkan pesan kesalahan jika data tidak lengkap saat submit', () => {
    component.fullName = '';
    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.formError()).toContain('Nama lengkap');
  });

  it('harus memvalidasi jika konfirmasi PIN tidak cocok', () => {
    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '482915';
    component.workerPinConfirm = '739184';
    component.doctrineAgreement = true;

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.formError()).toContain('tidak cocok');
  });

  it('harus menolak submit jika PIN menggunakan kombinasi lemah seperti 123456 atau 000000', () => {
    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '123456';
    component.workerPinConfirm = '123456';
    component.doctrineAgreement = true;

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.formError()).toContain('PIN terlalu lemah');
  });

  it('harus berhasil submit dan menampilkan kartu aktivasi WhatsApp saat data valid', () => {
    const { of } = require('rxjs');
    const registerSpy = jest.spyOn(authService, 'register').mockReturnValue(
      of({
        success: true,
        data: {
          worker_id: 'w-1',
          name: 'Budi Santoso',
          slug: 'budi-santoso',
          whatsapp_number: '6281234567890',
          admin_whatsapp_number: '6281234567890',
          activation_url: 'http://localhost:3000/api/admin/workers/activate?token=abc',
          whatsapp_share_url: 'https://wa.me/6281234567890?text=halo',
          expires_in_minutes: 15,
        },
      })
    );

    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '482915';
    component.workerPinConfirm = '482915';
    component.doctrineAgreement = true;
    component.altchaVerified.set(true);

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(registerSpy).toHaveBeenCalled();
    expect(component.formError()).toBe('');
    expect(component.formSuccess()).toContain('Pendaftaran berhasil diajukan');
    expect(component.registrationResult()).not.toBeNull();
    expect(component.registrationResult()?.name).toBe('Budi Santoso');
    expect(component.isLoading()).toBe(false);

    const successCard = fixture.nativeElement.querySelector('#workerRegistrationSuccessCard');
    expect(successCard).toBeTruthy();
  });

  it('harus menampilkan formError saat authService.register mengembalikan error', () => {
    const { of } = require('rxjs');
    jest.spyOn(authService, 'register').mockReturnValue(
      of({ success: false, error: 'Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.' })
    );

    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '482915';
    component.workerPinConfirm = '482915';
    component.doctrineAgreement = true;
    component.altchaVerified.set(true);

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.formError()).toBe(
      'Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.'
    );
    expect(component.formSuccess()).toBe('');
  });

  it('harus mengatur registrationResult ke null pada kondisi awal', () => {
    expect(component.registrationResult()).toBeNull();
  });

  it('harus memancarkan event basecampChange saat basecamp diubah', () => {
    let emitted = '';
    component.basecampChange.subscribe((val) => {
      emitted = val;
    });

    const inputEl = fixture.nativeElement.querySelector('#basecamp') as HTMLInputElement;
    inputEl.value = 'Bandung Barat';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.basecamp).toBe('Bandung Barat');
    expect(emitted).toBe('Bandung Barat');
  });

  it('harus mengabaikan handleFormSubmit jika sedang isLoading untuk mencegah dobel submit', () => {
    const registerSpy = jest.spyOn(authService, 'register');
    component.isLoading.set(true);

    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '482915';
    component.workerPinConfirm = '482915';
    component.doctrineAgreement = true;

    component.handleFormSubmit();

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('harus menolak submit registrasi jika tantangan ALTCHA belum diverifikasi', () => {
    const registerSpy = jest.spyOn(authService, 'register');

    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '482915';
    component.workerPinConfirm = '482915';
    component.doctrineAgreement = true;
    component.onAltchaVerified('');

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(registerSpy).not.toHaveBeenCalled();
    expect(component.formError()).toContain('Verifikasi keamanan captcha wajib diselesaikan');
  });
});
