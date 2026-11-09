import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkerDashboardProfilePageComponent } from './worker-dashboard-profile-page.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardProfilePageComponent', () => {
  let component: WorkerDashboardProfilePageComponent;
  let fixture: ComponentFixture<WorkerDashboardProfilePageComponent>;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardProfilePageComponent],
      providers: [
        WorkerDashboardStore,
        WorkerDashboardApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardProfilePageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus berhasil dibuat', () => {
    expect(component).toBeTruthy();
  });

  it('harus memperbarui avatar saat onAvatarChanged dipanggil', () => {
    component.onAvatarChanged('https://example.com/new-avatar.webp');
    expect(store.workerAvatarUrl()).toBe('https://example.com/new-avatar.webp');
  });

  it('harus memicu submitProfileUpdate saat submitProfileForm dipanggil', () => {
    const spy = jest.spyOn(store, 'submitProfileUpdate');
    component.submitProfileForm();
    expect(spy).toHaveBeenCalled();
  });
});

