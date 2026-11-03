import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardStatusToggleComponent } from './dashboard-status-toggle.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [DashboardStatusToggleComponent],
  template: `
    <app-dashboard-status-toggle
      [isOnline]="onlineState"
      (toggleStatus)="onToggle()"
    />
  `,
})
class TestHostComponent {
  onlineState = true;
  toggleCount = 0;
  onToggle(): void {
    this.toggleCount++;
    this.onlineState = !this.onlineState;
  }
}

describe('DashboardStatusToggleComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DashboardStatusToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender status ONLINE saat isOnline true', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('ONLINE • SIAP TERIMA');
  });

  it('harus memancarkan toggleStatus saat tombol switch diklik', () => {
    const button = fixture.nativeElement.querySelector('button[role="switch"]');
    button.click();
    fixture.detectChanges();

    expect(hostComponent.toggleCount).toBe(1);
    expect(hostComponent.onlineState).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('OFFLINE • ISTIRAHAT');
  });
});

