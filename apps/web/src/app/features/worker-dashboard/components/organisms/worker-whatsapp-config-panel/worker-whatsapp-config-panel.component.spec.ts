import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerWhatsAppConfigPanelComponent } from './worker-whatsapp-config-panel.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerWhatsAppConfigPanelComponent', () => {
  let component: WorkerWhatsAppConfigPanelComponent;
  let fixture: ComponentFixture<WorkerWhatsAppConfigPanelComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: {
    updateWorkerProfile: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      updateWorkerProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Berhasil diperbarui',
          data: {
            name: 'Sarah Melinda',
            whatsapp_number: '6281288992211',
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerWhatsAppConfigPanelComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerWhatsAppConfigPanelComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  afterEach(() => {
    store.clearOtpTimer();
  });

  it('harus membuat instance organism panel konfigurasi whatsapp', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan nomor whatsapp terformat', () => {
    store.workerWhatsAppNumber.set('6281288992211');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[readonly]') as HTMLInputElement;
    expect(input.value).toBe('+62 812-8899-2211');
  });

  it('harus memicu simulasi pesan OTP saat tombol Uji OTP diklik', () => {
    jest.useFakeTimers();
    store.triggerOtpTest();
    fixture.detectChanges();

    expect(store.otpFeedbackMessage()).toBe('Kode Dikirim ✓');

    jest.advanceTimersByTime(3000);
    expect(store.otpFeedbackMessage()).toBeNull();
    jest.useRealTimers();
  });

  it('harus beralih ke mode edit nomor whatsapp dan dapat membatalkan', () => {
    store.startEditingWhatsAppNumber();
    fixture.detectChanges();

    expect(store.isEditingWhatsAppNumber()).toBe(true);

    store.cancelEditingWhatsAppNumber();
    fixture.detectChanges();

    expect(store.isEditingWhatsAppNumber()).toBe(false);
  });

  it('harus menyimpan nomor whatsapp yang diedit', () => {
    store.workerRecordId.set('worker-uuid-1');
    store.startEditingWhatsAppNumber();
    store.editWhatsAppNumberInput.set('628999888777');
    store.saveEditedWhatsAppNumber();

    expect(store.workerWhatsAppNumber()).toBe('628999888777');
    expect(store.isEditingWhatsAppNumber()).toBe(false);
  });
});
