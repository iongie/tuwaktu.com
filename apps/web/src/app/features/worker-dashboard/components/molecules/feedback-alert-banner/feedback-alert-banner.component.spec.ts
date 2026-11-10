import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackAlertBannerComponent } from './feedback-alert-banner.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [FeedbackAlertBannerComponent],
  template: `
    <app-feedback-alert-banner
      [message]="testMessage"
      [type]="testType"
      [title]="testTitle"
      [autoDismiss]="testAutoDismiss"
      [durationMs]="testDurationMs"
      [hasRetry]="testHasRetry"
      [retryLabel]="testRetryLabel"
      [testId]="testId"
      [retryTestId]="retryTestId"
      [dismissTestId]="dismissTestId"
      (dismiss)="onDismiss()"
      (retryAction)="onRetry()"
    />
  `,
})
class TestHostComponent {
  testMessage: string | null = null;
  testType: 'success' | 'error' = 'success';
  testTitle: string | null = null;
  testAutoDismiss = true;
  testDurationMs = 4000;
  testHasRetry = false;
  testRetryLabel = 'Coba Lagi';
  testId: string | null = null;
  retryTestId: string | null = null;
  dismissTestId: string | null = null;

  dismissCount = 0;
  retryCount = 0;

  onDismiss(): void {
    this.dismissCount++;
    this.testMessage = null;
  }

  onRetry(): void {
    this.retryCount++;
  }
}

describe('FeedbackAlertBannerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FeedbackAlertBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('harus merender pesan notifikasi dan tombol tutup', () => {
    hostComponent.testMessage = 'Konfigurasi berhasil disimpan';
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Konfigurasi berhasil disimpan');
    expect(el.textContent).toContain('Tutup');
  });

  it('harus memancarkan event dismiss saat tombol Tutup diklik', () => {
    hostComponent.testMessage = 'Konfigurasi berhasil disimpan';
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Tutup notifikasi"]') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();

    expect(hostComponent.dismissCount).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('Konfigurasi berhasil disimpan');
  });

  it('harus melakukan auto-dismiss setelah 4000ms untuk tipe success', () => {
    hostComponent.testMessage = 'Konfigurasi berhasil disimpan';
    hostComponent.testType = 'success';
    fixture.detectChanges();

    expect(hostComponent.dismissCount).toBe(0);

    jest.advanceTimersByTime(3999);
    fixture.detectChanges();
    expect(hostComponent.dismissCount).toBe(0);

    jest.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(hostComponent.dismissCount).toBe(1);
  });

  it('TIDAK boleh melakukan auto-dismiss saat tipe error', () => {
    hostComponent.testType = 'error';
    hostComponent.testMessage = 'Gagal menyimpan data';
    fixture.detectChanges();

    jest.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(hostComponent.dismissCount).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Gagal menyimpan data');
  });

  it('harus menghentikan auto-dismiss saat mouseenter dan melanjutkan saat mouseleave', () => {
    hostComponent.testMessage = 'Konfigurasi berhasil disimpan';
    hostComponent.testType = 'success';
    fixture.detectChanges();

    const bannerEl = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(bannerEl).toBeTruthy();

    // Berjalan 2000ms awal
    jest.advanceTimersByTime(2000);
    expect(hostComponent.dismissCount).toBe(0);

    // Hover mouse (pause)
    bannerEl.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    // Tunggu 3000ms lagi saat di-hover (seharusnya tidak dismiss)
    jest.advanceTimersByTime(3000);
    expect(hostComponent.dismissCount).toBe(0);

    // Mouse leave (resume timer)
    bannerEl.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    // Tunggu durasi baru selesai
    jest.advanceTimersByTime(3999);
    expect(hostComponent.dismissCount).toBe(0);

    jest.advanceTimersByTime(1);
    expect(hostComponent.dismissCount).toBe(1);
  });

  it('harus merender tombol Coba Lagi dan memancarkan retryAction saat diklik', () => {
    hostComponent.testType = 'error';
    hostComponent.testMessage = 'Koneksi terputus';
    hostComponent.testHasRetry = true;
    hostComponent.testRetryLabel = 'Coba Ulang';
    fixture.detectChanges();

    const retryBtn = fixture.nativeElement.querySelector('button[aria-label="Coba lagi"]') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    expect(retryBtn.textContent).toContain('Coba Ulang');

    retryBtn.click();
    expect(hostComponent.retryCount).toBe(1);
  });
});
