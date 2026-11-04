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
        provideRouter([{ path: 'dashboard', component: class DummyDashboardComponent {} }]),
        AuthService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerRegisterFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
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
    component.workerPin = '123456';
    component.workerPinConfirm = '654321';
    component.doctrineAgreement = true;

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.formError()).toContain('tidak cocok');
  });

  it('harus berhasil submit dan navigasi ke dashboard saat seluruh data valid', () => {
    jest.useFakeTimers();
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.fullName = 'Budi Santoso';
    component.waNumber = '081234567890';
    component.basecamp = 'Jakarta Selatan';
    component.customSlug = 'budi-santoso';
    component.workerPin = '123456';
    component.workerPinConfirm = '123456';
    component.doctrineAgreement = true;

    component.handleFormSubmit();
    fixture.detectChanges();

    expect(component.formError()).toBe('');
    expect(component.formSuccess()).toContain('Selamat! Profil kedaulatan Anda berhasil diaktifkan');

    jest.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    jest.useRealTimers();
  });

  it('harus memicu pengiriman OTP saat tombol Kirim OTP ditekan', async () => {
    const sendOtpSpy = jest.spyOn(authService, 'sendInstantOtp').mockResolvedValue(true);
    component.waNumber = '081234567890';
    await component.triggerOtpSend();
    expect(sendOtpSpy).toHaveBeenCalledWith('081234567890');
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
});
