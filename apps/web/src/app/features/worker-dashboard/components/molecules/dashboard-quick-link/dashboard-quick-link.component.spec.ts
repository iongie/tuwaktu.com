import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardQuickLinkComponent } from './dashboard-quick-link.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [DashboardQuickLinkComponent],
  template: `
    <app-dashboard-quick-link
      [urlText]="'tuwaktu.com/budi-santoso'"
      [feedbackMessage]="copyMsg"
      (copyLink)="onCopy()"
    />
  `,
})
class TestHostComponent {
  copyMsg: string | null = null;
  copied = false;
  onCopy(): void {
    this.copied = true;
    this.copyMsg = 'Tersalin!';
  }
}

describe('DashboardQuickLinkComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DashboardQuickLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender teks URL dan tombol salin', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('tuwaktu.com/budi-santoso');
    expect(el.textContent).toContain('Salin');
  });

  it('harus memancarkan event copyLink dan menampilkan feedback Tersalin', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    fixture.detectChanges();

    expect(host.copied).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Tersalin!');
  });
});

