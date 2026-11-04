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

  it('harus merender nilai 4 kartu metrik persis desain Stitch (termasuk Rp 4.550.000 dan 0% POTONGAN)', () => {
    const store = TestBed.inject(WorkerDashboardStore);
    store.workerBasePrice.set(75000);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bulan Berjalan');
    expect(el.textContent).toContain('28');
    expect(el.textContent).toContain('Pendapatan Mandiri');
    expect(el.textContent).toContain('Rp 4.550.000');
    expect(el.textContent).toContain('0% POTONGAN');
    expect(el.textContent).toContain('Efisiensi Kerja');
    expect(el.textContent).toContain('2.5 Jam');
    expect(el.textContent).toContain('Reputasi Klien');
    expect(el.textContent).toContain('4.9 / 5.0');
  });

  it('harus merender identitas operator Sarah Melinda dan lencana verifikasi persis Stitch', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Sarah Melinda');
    expect(el.textContent).toContain('TWK-JKT-8821');
    expect(el.textContent).toContain('ONLINE • SIAP ORDER');
    expect(el.textContent).toContain('Dokumen Terverifikasi KTP');
  });

  it('harus merender Sovereign Link Widget dengan QR Code SVG dan tombol aksi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tautan Publik Klien');
    expect(el.textContent).toContain('tuwaktu.com/sarah-cleaning');
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
