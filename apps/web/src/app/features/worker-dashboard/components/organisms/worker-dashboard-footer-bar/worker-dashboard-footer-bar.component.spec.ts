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

  it('harus merender tombol Simpan Perubahan dan Batal sesuai rancangan Stitch', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Simpan Perubahan');
    expect(el.textContent).toContain('Batal');
    expect(el.textContent).toContain('Perubahan tersimpan otomatis ke profil publik');
  });

  it('harus memancarkan resetSelection saat tombol Batal diklik di luar rute logistik', () => {
    let resetEmitted = false;
    component.resetSelection.subscribe(() => {
      resetEmitted = true;
    });

    const batalBtn: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[0];
    batalBtn.click();
    expect(resetEmitted).toBe(true);
  });

  it('harus memanggil submitRatesUpdate saat simpan diklik pada rute tarif', () => {
    jest.spyOn(store, 'submitRatesUpdate');
    component.saveChanges();
    expect(store.submitRatesUpdate).toHaveBeenCalled();
  });

  it('harus memanggil submitLocationSettingsUpdate saat simpan diklik pada rute logistik', () => {
    mockRouter.url = '/dashboard/logistik-radius';
    fixture.detectChanges();

    jest.spyOn(store, 'submitLocationSettingsUpdate');
    component.saveChanges();
    expect(store.submitLocationSettingsUpdate).toHaveBeenCalled();
  });

  it('harus memanggil resetLocationToDefault saat Batal diklik pada rute logistik', () => {
    mockRouter.url = '/dashboard/logistik-radius';
    fixture.detectChanges();

    jest.spyOn(store, 'resetLocationToDefault');
    component.cancelChanges();
    expect(store.resetLocationToDefault).toHaveBeenCalled();
  });

  it('harus memanggil submitScheduleUpdate saat simpan diklik pada rute kalender', () => {
    mockRouter.url = '/dashboard/kalender-slot';
    fixture.detectChanges();

    jest.spyOn(store, 'submitScheduleUpdate');
    component.saveChanges();
    expect(store.submitScheduleUpdate).toHaveBeenCalled();
  });

  it('harus memanggil resetScheduleToDefault saat Batal diklik pada rute kalender', () => {
    mockRouter.url = '/dashboard/kalender-slot';
    fixture.detectChanges();

    jest.spyOn(store, 'resetScheduleToDefault');
    component.cancelChanges();
    expect(store.resetScheduleToDefault).toHaveBeenCalled();
  });

  it('harus menampilkan teks dan tombol operasional presisi Stitch saat berada di rute kalender-slot', () => {
    mockRouter.url = '/dashboard/kalender-slot';
    component.cdr.markForCheck();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Sinkronisasi Instan ke WhatsApp Pemesan');
    expect(el.textContent).toContain('Atur Ulang Default');
    expect(el.textContent).toContain('Simpan Perubahan Jadwal');

    const saveBtn = el.querySelector('#saveScheduleBtn');
    expect(saveBtn).toBeTruthy();
  });
});
