import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminWorkerCreatePageComponent } from './admin-worker-create-page.component';
import { AdminWorkerStore } from '../../../services/admin-worker.store';
import { AdminWorkerCreatedResponse } from '../../../models/admin-worker.model';

describe('AdminWorkerCreatePageComponent', () => {
  let component: AdminWorkerCreatePageComponent;
  let fixture: ComponentFixture<AdminWorkerCreatePageComponent>;
  let router: Router;
  let mockStore: {
    isOnboardingSubmitting: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    newlyCreatedWorker: ReturnType<typeof signal<AdminWorkerCreatedResponse | null>>;
    submitOnboarding: jest.Mock;
  };

  beforeEach(async () => {
    mockStore = {
      isOnboardingSubmitting: signal<boolean>(false),
      errorMessage: signal<string | null>(null),
      newlyCreatedWorker: signal<AdminWorkerCreatedResponse | null>(null),
      submitOnboarding: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminWorkerCreatePageComponent],
      providers: [
        provideRouter([{ path: '**', component: AdminWorkerCreatePageComponent }]),
        { provide: AdminWorkerStore, useValue: mockStore },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AdminWorkerCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance halaman pendaftaran mitra admin', () => {
    expect(component).toBeTruthy();
  });

  it('harus menolak submit jika data form belum valid', () => {
    component.name.set('Bu');
    component.whatsappNumber.set('123');
    expect(component.isFormValid()).toBe(false);

    component.handleSubmitOnboarding();
    expect(mockStore.submitOnboarding).not.toHaveBeenCalled();
  });

  it('harus memanggil submitOnboarding saat form valid disubmit', () => {
    component.onNameChange('Budi Santoso');
    component.whatsappNumber.set('081234567890');
    component.zone.set('Surabaya');
    fixture.detectChanges();

    expect(component.isFormValid()).toBe(true);
    component.handleSubmitOnboarding();

    expect(mockStore.submitOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        zone: 'Surabaya',
      })
    );
  });

  it('harus merender layar sukses kredensial saat newlyCreatedWorker bernilai ada', () => {
    mockStore.newlyCreatedWorker.set({
      account: {
        id: 'acc-1',
        email: 'budi@tuwaktu.internal',
        phone_number: '081234567890',
        role: 'WORKER',
        account_status: 'ACTIVE',
        must_change_password: true,
      },
      worker: {
        id: 'wrk-1',
        slug: 'budi-santoso',
        name: 'Budi Santoso',
        zone: 'Surabaya',
      },
      temporary_password: 'PIN-123456',
      invitation_text: 'Selamat bergabung!',
    });

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mitra Berhasil Didaftarkan ke Database');
    expect(text).toContain('PIN-123456');
    expect(text).toContain('081234567890');
    expect(text).toContain('tuwaktu.com/budi-santoso');
    expect(text).toContain('Kirim Kredensial via WhatsApp');
  });

  it('harus mereset form saat tombol Daftarkan Mitra Lain diklik pada layar sukses', () => {
    mockStore.newlyCreatedWorker.set({
      account: {
        id: 'acc-1',
        email: 'budi@tuwaktu.internal',
        phone_number: '081234567890',
        role: 'WORKER',
        account_status: 'ACTIVE',
        must_change_password: true,
      },
      worker: {
        id: 'wrk-1',
        slug: 'budi-santoso',
        name: 'Budi Santoso',
        zone: 'Surabaya',
      },
      temporary_password: 'PIN-123456',
      invitation_text: 'Selamat bergabung!',
    });
    fixture.detectChanges();

    component.handleResetForNextWorker();
    expect(mockStore.newlyCreatedWorker()).toBeNull();
    expect(component.name()).toBe('');
  });

  it('harus bernavigasi ke /admin/workers saat tombol Selesai diklik', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.handleFinishAndReturn();
    expect(mockStore.newlyCreatedWorker()).toBeNull();
    expect(navSpy).toHaveBeenCalledWith(['/admin/workers']);
  });
});

