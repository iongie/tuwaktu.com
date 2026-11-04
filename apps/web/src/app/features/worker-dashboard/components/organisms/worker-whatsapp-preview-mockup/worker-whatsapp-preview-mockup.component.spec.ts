import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerWhatsAppPreviewMockupComponent } from './worker-whatsapp-preview-mockup.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerWhatsAppPreviewMockupComponent', () => {
  let component: WorkerWhatsAppPreviewMockupComponent;
  let fixture: ComponentFixture<WorkerWhatsAppPreviewMockupComponent>;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerWhatsAppPreviewMockupComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: {
            updateWorkerProfile: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerWhatsAppPreviewMockupComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance organism preview mockup whatsapp', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender teks pesan pratinjau live dari store', () => {
    store.setWhatsAppTemplate('Pesan uji coba live');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pesan uji coba live');
  });

  it('harus menghasilkan tautan deep link wa.me yang valid', () => {
    store.workerWhatsAppNumber.set('6281234567890');
    store.setWhatsAppTemplate('Halo Mitra');
    fixture.detectChanges();

    const deepLinkAnchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(deepLinkAnchor.href).toContain('https://wa.me/6281234567890');
    expect(deepLinkAnchor.href).toContain('Halo%20Mitra');
  });
});
