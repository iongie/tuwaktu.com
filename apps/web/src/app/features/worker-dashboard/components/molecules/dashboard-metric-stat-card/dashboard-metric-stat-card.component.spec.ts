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
    <app-dashboard-metric-stat-card
      [label]="'Pendapatan Mandiri'"
      [value]="'Rp 4.550.000'"
      [icon]="'payments'"
      [badgeText]="'0% POTONGAN'"
      [starsCount]="5"
    />
    <app-dashboard-metric-stat-card
      [label]="'Rating Parsial'"
      [value]="'3.0'"
      [icon]="'star'"
      [starsCount]="3"
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

  it('harus merender badge 0% POTONGAN dan bintang reputasi jika disediakan', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('0% POTONGAN');
    expect(el.textContent).toContain('Rp 4.550.000');
  });

  it('harus merender jumlah bintang secara dinamis sesuai starsCount yang dipassing', () => {
    const cards = fixture.nativeElement.querySelectorAll('app-dashboard-metric-stat-card');
    const card2Stars = cards[1].querySelectorAll('.text-voltage-orange .material-symbols-outlined');
    expect(card2Stars.length).toBe(5);

    const card3Stars = cards[2].querySelectorAll('.text-voltage-orange .material-symbols-outlined');
    expect(card3Stars.length).toBe(3);
  });
});
