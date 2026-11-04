import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerWhatsAppTemplatePanelComponent } from './worker-whatsapp-template-panel.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerWhatsAppTemplatePanelComponent', () => {
  let component: WorkerWhatsAppTemplatePanelComponent;
  let fixture: ComponentFixture<WorkerWhatsAppTemplatePanelComponent>;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerWhatsAppTemplatePanelComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: {
            updateWorkerProfile: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerWhatsAppTemplatePanelComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance organism panel template whatsapp', () => {
    expect(component).toBeTruthy();
  });

  it('harus memperbarui template saat textarea diinput', () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Format pesan kustom';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(store.whatsappMessageTemplate()).toBe('Format pesan kustom');
  });

  it('harus menyisipkan token ke dalam template', () => {
    store.setWhatsAppTemplate('Halo ');
    component.insertTokenAtCursor('{{NAMA_KLIEN}}');

    expect(store.whatsappMessageTemplate()).toContain('{{NAMA_KLIEN}}');
  });

  it('harus dapat mengubah granular switches (gmaps, breakdown, notes)', () => {
    expect(store.includeGmapsLocation()).toBe(true);
    store.toggleGmapsOption();
    expect(store.includeGmapsLocation()).toBe(false);

    expect(store.includeCostBreakdown()).toBe(true);
    store.toggleBreakdownOption();
    expect(store.includeCostBreakdown()).toBe(false);

    expect(store.includeSpecialNotes()).toBe(true);
    store.toggleNotesOption();
    expect(store.includeSpecialNotes()).toBe(false);
  });
});
