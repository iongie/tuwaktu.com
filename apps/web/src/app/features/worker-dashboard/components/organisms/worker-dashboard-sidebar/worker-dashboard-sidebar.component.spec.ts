import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardSidebarComponent } from './worker-dashboard-sidebar.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkerDashboardSidebarComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardSidebarComponent>;
  let component: WorkerDashboardSidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardSidebarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender logo Tuwaktu Workspace PRO dan 7 modul kerja navigasi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TUWAKTU');
    expect(el.textContent).toContain('WORKSPACE PRO');
    expect(el.textContent).toContain('Ringkasan');
    expect(el.textContent).toContain('Tarif & Layanan');
    expect(el.textContent).toContain('Logistik & Basecamp');
    expect(el.textContent).toContain('Kalender & Slot');
    expect(el.textContent).toContain('Integrasi WhatsApp');
    expect(el.textContent).toContain('Paket & Langganan');
    expect(el.textContent).toContain('Boost Visibilitas');
    expect(component.menuItems.length).toBe(7);
  });
});

