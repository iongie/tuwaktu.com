import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardFooterBarComponent } from './worker-dashboard-footer-bar.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkerDashboardFooterBarComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardFooterBarComponent>;
  let component: WorkerDashboardFooterBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardFooterBarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardFooterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender tombol Simpan Perubahan dan Batal sesuai rancangan Stitch', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Simpan Perubahan');
    expect(el.textContent).toContain('Batal');
    expect(el.textContent).toContain('Perubahan tersimpan otomatis ke profil publik');
  });

  it('harus memancarkan resetSelection saat tombol Batal diklik', () => {
    let resetEmitted = false;
    component.resetSelection.subscribe(() => {
      resetEmitted = true;
    });

    const batalBtn: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[0];
    batalBtn.click();
    expect(resetEmitted).toBe(true);
  });
});

