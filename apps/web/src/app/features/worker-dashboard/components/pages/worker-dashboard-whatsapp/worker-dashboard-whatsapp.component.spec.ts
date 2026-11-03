import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerDashboardWhatsAppProfileComponent } from './worker-dashboard-whatsapp.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardWhatsAppProfileComponent', () => {
  let component: WorkerDashboardWhatsAppProfileComponent;
  let fixture: ComponentFixture<WorkerDashboardWhatsAppProfileComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: {
    updateWorkerProfile: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      updateWorkerProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Profil berhasil disimpan',
          data: {
            name: 'Budi Santoso',
            whatsapp_number: '6281234567890',
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardWhatsAppProfileComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardWhatsAppProfileComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen whatsapp & profil', () => {
    expect(component).toBeTruthy();
  });

  it('harus memanggil submitProfileUpdate saat form disubmit', () => {
    store.workerRecordId.set('worker-uuid-1');
    component.onFullNameChange('Budi Santoso');
    component.onWhatsAppChange('6281234567890');

    component.submitProfile();

    expect(mockApiService.updateWorkerProfile).toHaveBeenCalledWith(
      'worker-uuid-1',
      expect.objectContaining({
        name: 'Budi Santoso',
        whatsapp_number: '6281234567890',
      })
    );
  });
});

