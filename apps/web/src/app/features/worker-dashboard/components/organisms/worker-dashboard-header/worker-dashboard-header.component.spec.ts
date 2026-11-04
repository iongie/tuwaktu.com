import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardHeaderComponent } from './worker-dashboard-header.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import { of } from 'rxjs';

describe('WorkerDashboardHeaderComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardHeaderComponent>;
  let component: WorkerDashboardHeaderComponent;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardHeaderComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
        {
          provide: WorkerDashboardApiService,
          useValue: {
            fetchWorkerProfile: jest.fn().mockReturnValue(of({ success: true })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardHeaderComponent);
    component = fixture.componentInstance;
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

  it('harus membuka dan menutup dialog switcher slug saat tombol diklik', () => {
    expect(component.isSwitcherOpen()).toBe(false);

    component.toggleSwitcher();
    fixture.detectChanges();
    expect(component.isSwitcherOpen()).toBe(true);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ganti Profil Mitra');
    expect(el.textContent).toContain('Pilihan Cepat:');

    component.closeSwitcher();
    fixture.detectChanges();
    expect(component.isSwitcherOpen()).toBe(false);
  });

  it('harus memilih preset slug dengan benar', () => {
    component.toggleSwitcher();
    component.selectPreset('eko-teknisi');
    expect(component.switcherSlugValue()).toBe('eko-teknisi');
  });

  it('harus menampilkan pesan error jika pemuatan profil gagal dan meresetnya saat dibuka ulang', () => {
    component.toggleSwitcher();
    store.profileFeedbackError.set('Profil tidak ditemukan');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Profil tidak ditemukan');

    component.closeSwitcher();
    component.toggleSwitcher();
    expect(store.profileFeedbackError()).toBe('');
  });
});
