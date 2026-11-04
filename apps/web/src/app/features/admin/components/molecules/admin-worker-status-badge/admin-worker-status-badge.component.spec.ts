import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminWorkerStatusBadgeComponent } from './admin-worker-status-badge.component';

describe('AdminWorkerStatusBadgeComponent', () => {
  let component: AdminWorkerStatusBadgeComponent;
  let fixture: ComponentFixture<AdminWorkerStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkerStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkerStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('harus merender badge status Aktif saat status ACTIVE', () => {
    expect(component).toBeTruthy();
    fixture.componentRef.setInput('status', 'ACTIVE');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('[data-testid="status-badge-active"]');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Aktif');
  });

  it('harus merender badge status Ditangguhkan saat status SUSPENDED', () => {
    fixture.componentRef.setInput('status', 'SUSPENDED');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('[data-testid="status-badge-suspended"]');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Ditangguhkan');
  });
});

