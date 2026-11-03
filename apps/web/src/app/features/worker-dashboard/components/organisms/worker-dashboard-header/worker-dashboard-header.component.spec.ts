import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardHeaderComponent } from './worker-dashboard-header.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkerDashboardHeaderComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardHeaderComponent>;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardHeaderComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardHeaderComponent);
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus merender status Menerima Pesanan dan Pratinjau Publik saat slug tersedia', () => {
    store.workerSlugIdentifier.set('budi-santoso');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Menerima Pesanan');
    expect(el.textContent).toContain('Pratinjau Publik');
  });
});

