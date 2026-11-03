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

  it('harus merender tombol Simpan Konfigurasi dan Reset', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Simpan Konfigurasi');
    expect(el.textContent).toContain('Reset');
    expect(el.textContent).toContain('Semua Perubahan Disinkronkan Otomatis');
  });

  it('harus memancarkan resetSelection saat tombol Reset diklik', () => {
    let resetEmitted = false;
    component.resetSelection.subscribe(() => {
      resetEmitted = true;
    });

    const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[0];
    resetBtn.click();
    expect(resetEmitted).toBe(true);
  });
});

