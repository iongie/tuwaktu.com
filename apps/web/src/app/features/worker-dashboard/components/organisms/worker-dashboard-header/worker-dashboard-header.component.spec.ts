import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardHeaderComponent } from './worker-dashboard-header.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import { of } from 'rxjs';

import { AuthService } from '../../../../auth/services/auth.service';
import { Router } from '@angular/router';

import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('WorkerDashboardHeaderComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardHeaderComponent>;
  let component: WorkerDashboardHeaderComponent;
  let store: WorkerDashboardStore;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardHeaderComponent],
      providers: [
        provideRouter([
          { path: 'login', component: DummyLoginComponent },
          { path: '**', component: DummyLoginComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
        AuthService,
        {
          provide: WorkerDashboardApiService,
          useValue: {
            fetchWorkerProfile: jest.fn().mockReturnValue(of({ success: true })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardHeaderComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('harus merender status Menerima Pesanan dan Pratinjau Publik saat slug tersedia', () => {
    store.workerSlugIdentifier.set('budi-santoso');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Menerima Pesanan');
    expect(el.textContent).toContain('Pratinjau Publik');
  });

  it('harus membuka dan menutup dialog switcher slug saat tombol diklik', () => {
    expect(component.isSwitcherOpen()).toBe(false);

    component.toggleSwitcher();
    fixture.detectChanges();
    expect(component.isSwitcherOpen()).toBe(true);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ganti Profil Mitra');
    expect(el.textContent).toContain('Pilihan Cepat:');

    component.closeSwitcher();
    fixture.detectChanges();
    expect(component.isSwitcherOpen()).toBe(false);
  });

  it('harus memilih preset slug dengan benar', () => {
    component.toggleSwitcher();
    component.selectPreset('eko-teknisi');
    expect(component.switcherSlugValue()).toBe('eko-teknisi');
  });

  it('harus menampilkan pesan error jika pemuatan profil gagal dan meresetnya saat dibuka ulang', () => {
    component.toggleSwitcher();
    store.profileFeedbackError.set('Profil tidak ditemukan');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Profil tidak ditemukan');

    component.closeSwitcher();
    component.toggleSwitcher();
    expect(store.profileFeedbackError()).toBe('');
  });

  it('harus membuka modal konfirmasi saat tombol Keluar di header diklik', () => {
    const logoutBtn = fixture.nativeElement.querySelector('#headerLogoutBtn');
    expect(logoutBtn).toBeTruthy();

    logoutBtn.click();
    fixture.detectChanges();

    expect(component.isLogoutModalOpen()).toBe(true);
    const modal = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('Konfirmasi Keluar Akun');
  });

  it('harus memanggil authService.logout dan redirect saat konfirmasi logout diterima', () => {
    const logoutSpy = jest.spyOn(authService, 'logout');
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.executeLogout();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(component.isLogoutModalOpen()).toBe(false);
  });

  it('harus membuka dan menutup dropdown menu profil serta memastikan lebar navbar sejajar max-w-7xl', () => {
    expect(component.isProfileMenuOpen()).toBe(false);

    const profileBtn = fixture.nativeElement.querySelector('#dashboardProfileMenuBtn');
    expect(profileBtn).toBeTruthy();

    profileBtn.click();
    fixture.detectChanges();
    expect(component.isProfileMenuOpen()).toBe(true);

    component.handleEscape();
    fixture.detectChanges();
    expect(component.isProfileMenuOpen()).toBe(false);

    const headerContainer = fixture.nativeElement.querySelector('header > div.max-w-7xl');
    expect(headerContainer).toBeTruthy();
    expect(headerContainer.children.length).toBe(2);
  });
});
