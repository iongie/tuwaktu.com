import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardSidebarComponent } from './worker-dashboard-sidebar.component';
import { provideRouter, Router } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { AuthService } from '../../../../auth/services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('WorkerDashboardSidebarComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardSidebarComponent>;
  let component: WorkerDashboardSidebarComponent;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardSidebarComponent],
      providers: [
        provideRouter([
          { path: 'login', component: DummyLoginComponent },
          { path: '**', component: DummyLoginComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
        AuthService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardSidebarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('harus merender logo Tuwaktu Workspace PRO dan seluruh modul kerja navigasi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TUWAKTU');
    expect(el.textContent).toContain('WORKSPACE PRO');
    expect(el.textContent).toContain('Ringkasan');
    expect(el.textContent).toContain('Profil & Identitas');
    expect(el.textContent).toContain('Tarif & Layanan');
    expect(el.textContent).toContain('Logistik & Basecamp');
    expect(el.textContent).toContain('Kalender & Slot');
    expect(el.textContent).toContain('Integrasi WhatsApp');
    expect(el.textContent).toContain('Ulasan & Reputasi');
    expect(el.textContent).toContain('Paket & Langganan');
    expect(el.textContent).toContain('Boost Visibilitas');
    expect(component.menuItems.length).toBe(9);
  });

  it('harus merespons pembukaan dan penutupan drawer navigasi mobile', () => {
    const store = TestBed.inject(WorkerDashboardStore);
    expect(store.isMobileSidebarOpen()).toBe(false);

    store.toggleMobileSidebar();
    expect(store.isMobileSidebarOpen()).toBe(true);
    fixture.detectChanges();

    const backdropBtn = fixture.nativeElement.querySelector('button[aria-label="Tutup Bilah Navigasi"]');
    expect(backdropBtn).toBeTruthy();

    backdropBtn.click();
    expect(store.isMobileSidebarOpen()).toBe(false);
  });

  it('harus merender tombol Keluar Konsol dan membuka modal saat diklik', () => {
    const logoutBtn = fixture.nativeElement.querySelector('#sidebarLogoutBtn');
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn.textContent).toContain('Keluar Konsol');

    logoutBtn.click();
    fixture.detectChanges();

    expect(component.isLogoutModalOpen()).toBe(true);
    const modal = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(modal).toBeTruthy();
  });

  it('harus memanggil authService.logout dan redirect saat konfirmasi logout disetujui', () => {
    const logoutSpy = jest.spyOn(authService, 'logout');
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.executeLogout();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(component.isLogoutModalOpen()).toBe(false);
  });
});

