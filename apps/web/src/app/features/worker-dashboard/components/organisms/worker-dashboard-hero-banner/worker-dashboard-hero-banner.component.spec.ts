import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardHeroBannerComponent } from './worker-dashboard-hero-banner.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkerDashboardHeroBannerComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardHeroBannerComponent>;
  let component: WorkerDashboardHeroBannerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardHeroBannerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardHeroBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender kartu metrik telemetri otoritas bento dan switch status', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bulan Berjalan');
    expect(el.textContent).toContain('Pendapatan Mandiri');
    expect(el.textContent).toContain('Efisiensi Kerja');
    expect(el.textContent).toContain('Reputasi Klien');
  });

  it('harus merender nilai 4 kartu metrik secara dinamis dan jujur (termasuk 0% POTONGAN)', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bulan Berjalan');
    expect(el.textContent).toContain('Pendapatan Mandiri');
    expect(el.textContent).toContain('0% POTONGAN');
    expect(el.textContent).toContain('Efisiensi Kerja');
    expect(el.textContent).toContain('Reputasi Klien');
    expect(el.textContent).toContain('5.0 / 5.0');

    component.formattedRevenue.set('Rp 1.500.000');
    component.completedOrdersCount.set(12);
    fixture.detectChanges();

    expect(el.textContent).toContain('Rp 1.500.000');
    expect(el.textContent).toContain('12');
  });

  it('harus merender identitas operator dan lencana verifikasi secara dinamis', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Mitra Teknisi');
    expect(el.textContent).toContain('TWK-MITRA');
    expect(el.textContent).toContain('ONLINE • SIAP ORDER');
    expect(el.textContent).toContain('Dokumen Terverifikasi KTP');

    const store = TestBed.inject(WorkerDashboardStore);
    store.workerFullName.set('Budi Santoso');
    store.workerRecordId.set('usr-9921');
    fixture.detectChanges();

    expect(el.textContent).toContain('Budi Santoso');
    expect(el.textContent).toContain('TWK-USR-9921');
  });

  it('harus merender Sovereign Link Widget dengan QR Code SVG dan tombol aksi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tautan Publik Klien');
    expect(el.textContent).toContain('tuwaktu.com/mitra');
    expect(el.textContent).toContain('Salin');
    expect(el.textContent).toContain('Bagikan');
    const svgEl = el.querySelector('svg');
    expect(svgEl).toBeTruthy();
  });

  it('harus memanggil copyLink saat tombol Salin ditekan', () => {
    const spy = jest.spyOn(component, 'copyLink');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const copyButton = Array.from(buttons).find((b: unknown) =>
      (b as HTMLElement).textContent?.includes('Salin')
    ) as HTMLButtonElement | undefined;

    expect(copyButton).toBeTruthy();
    copyButton?.click();
    expect(spy).toHaveBeenCalled();
  });
});
