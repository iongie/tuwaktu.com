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
      (dismiss)="onDismiss()"
    />
  `,
})
class TestHostComponent {
  testMessage: string | null = 'Konfigurasi berhasil disimpan';
  testType: 'success' | 'error' = 'success';
  dismissCount = 0;
  onDismiss(): void {
    this.dismissCount++;
    this.testMessage = null;
  }
}

describe('FeedbackAlertBannerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FeedbackAlertBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender pesan notifikasi dan tombol tutup', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Konfigurasi berhasil disimpan');
    expect(el.textContent).toContain('Tutup');
  });

  it('harus memancarkan event dismiss saat tombol Tutup diklik', () => {
    const closeBtn = fixture.nativeElement.querySelector('button');
    closeBtn.click();
    fixture.detectChanges();

    expect(hostComponent.dismissCount).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('Konfigurasi berhasil disimpan');
  });
});

