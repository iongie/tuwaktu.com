import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardMetricStatCardComponent } from './dashboard-metric-stat-card.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [DashboardMetricStatCardComponent],
  template: `
    <app-dashboard-metric-stat-card
      [label]="'Pesanan Selesai'"
      [value]="28"
      [icon]="'task_alt'"
      [subtext]="'Bulan Berjalan'"
      [trendText]="'+6 order'"
      [trendIcon]="'arrow_upward'"
      [trendType]="'positive'"
    />
  `,
})
class TestHostComponent {}

describe('DashboardMetricStatCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DashboardMetricStatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('harus merender label, nilai, dan ikon metrik dengan benar', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Pesanan Selesai');
    expect(el.textContent).toContain('28');
    expect(el.textContent).toContain('Bulan Berjalan');
    expect(el.textContent).toContain('+6 order');
    expect(el.textContent).toContain('task_alt');
  });
});

