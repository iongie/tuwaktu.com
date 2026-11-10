import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkerDashboardFooterBarComponent } from './worker-dashboard-footer-bar.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

describe('WorkerDashboardFooterBarComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardFooterBarComponent>;
  let component: WorkerDashboardFooterBarComponent;
  let store: WorkerDashboardStore;
  let mockRouter: { url: string };

  beforeEach(async () => {
    mockRouter = { url: '/dashboard/tarif-layanan' };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardFooterBarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardFooterBarComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus merender status tersinkronisasi dan tombol Lihat Halaman Publik', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tersinkronisasi ke Profil Publik');
    expect(el.textContent).toContain('Lihat Halaman Publik');
    expect(el.textContent).toContain('Sinkronisasi terakhir:');

    // Memastikan tidak ada lagi tombol simpan ganda di footer
    expect(el.textContent).not.toContain('Simpan Perubahan');
    expect(el.textContent).not.toContain('Batal');

    const linkEl = el.querySelector('#btn-footer-view-public-profile') as HTMLAnchorElement;
    expect(linkEl).toBeTruthy();
    expect(linkEl.getAttribute('target')).toBe('_blank');
  });

  it('harus mengarahkan tombol Lihat Halaman Publik ke URL slug profil pekerja yang aktif', () => {
    store.workerSlugIdentifier.set('sarah-cleaner');
    fixture.detectChanges();

    const linkEl = fixture.nativeElement.querySelector('#btn-footer-view-public-profile') as HTMLAnchorElement;
    expect(linkEl.href).toContain('sarah-cleaner');
  });

  it('harus menampilkan timestamp logistik saat berada di rute logistik', () => {
    mockRouter.url = '/dashboard/logistik-radius';
    store.lastLocationSyncTimestamp.set('Kemarin, 10:00 WIB');
    component.cdr.markForCheck();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Kemarin, 10:00 WIB');
  });

  it('harus menampilkan timestamp jadwal saat berada di rute kalender-slot', () => {
    mockRouter.url = '/dashboard/kalender-slot';
    store.lastScheduleSyncTimestamp.set('Hari ini, 09:15 WIB');
    component.cdr.markForCheck();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Hari ini, 09:15 WIB');
  });
});
