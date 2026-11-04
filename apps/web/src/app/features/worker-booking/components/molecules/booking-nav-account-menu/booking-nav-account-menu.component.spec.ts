import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { BookingNavAccountMenuComponent } from './booking-nav-account-menu.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';

import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('BookingNavAccountMenuComponent', () => {
  let component: BookingNavAccountMenuComponent;
  let componentRef: ComponentRef<BookingNavAccountMenuComponent>;
  let fixture: ComponentFixture<BookingNavAccountMenuComponent>;
  let authService: AuthService;
  let router: Router;

  const mockWorker: PublicTechnicianProfile = {
    id: 'worker-1',
    slug: 'budi-santoso',
    name: 'Budi Santoso',
    bio: 'Teknisi AC',
    avatar_url: 'https://example.com/avatar.jpg',
    rating: 4.9,
    review_count: 10,
    zone: 'Jakarta Selatan',
    services: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingNavAccountMenuComponent],
      providers: [
        provideRouter([
          { path: 'login', component: DummyLoginComponent },
          { path: '**', component: DummyLoginComponent },
        ]),
        AuthService,
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    authService.logout();

    fixture = TestBed.createComponent(BookingNavAccountMenuComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('activeWorker', mockWorker);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen menu navigasi akun', () => {
    expect(component).toBeTruthy();
  });

  describe('Kondisi Belum Masuk (Guest)', () => {
    it('harus menampilkan tombol Masuk dan Daftar Mitra', () => {
      const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
      const registerBtn = fixture.nativeElement.querySelector('#navRegisterBtn');

      expect(loginBtn).toBeTruthy();
      expect(loginBtn.textContent).toContain('Masuk');
      expect(loginBtn.getAttribute('routerLink') || loginBtn.getAttribute('href')).toContain('/login');

      expect(registerBtn).toBeTruthy();
      expect(registerBtn.textContent).toContain('Daftar Mitra');
      expect(registerBtn.getAttribute('routerLink') || registerBtn.getAttribute('href')).toContain('/register');
    });

    it('harus menampilkan nama dan tautan profil mitra yang sedang aktif', () => {
      const avatarLink = fixture.nativeElement.querySelector('a[title="Masuk Profil Mitra"]');
      expect(avatarLink).toBeTruthy();
      expect(avatarLink.getAttribute('routerLink')).toBe('/dashboard/integrasi-whatsapp');
    });
  });

  describe('Kondisi Sudah Masuk (Logged In)', () => {
    beforeEach(() => {
      authService.setSession({
        id: 'usr-123',
        name: 'Sarah Melinda',
        slug: 'sarah-cleaning',
        role: 'worker',
      });
      fixture.detectChanges();
    });

    it('harus menampilkan tombol Dasbor Kerja dan trigger akun', () => {
      const quickDashboardBtn = fixture.nativeElement.querySelector('#navQuickDashboardBtn');
      const accountTrigger = fixture.nativeElement.querySelector('#accountMenuTrigger');

      expect(quickDashboardBtn).toBeTruthy();
      expect(quickDashboardBtn.textContent).toContain('Dasbor Kerja');
      expect(accountTrigger).toBeTruthy();
    });

    it('harus membuka dropdown menu saat trigger avatar diklik', () => {
      const accountTrigger = fixture.nativeElement.querySelector('#accountMenuTrigger');
      accountTrigger.click();
      fixture.detectChanges();

      const dashboardItem = fixture.nativeElement.querySelector('#menuItemDashboard');
      const profileItem = fixture.nativeElement.querySelector('#menuItemPublicProfile');
      const logoutItem = fixture.nativeElement.querySelector('#menuItemLogout');

      expect(dashboardItem).toBeTruthy();
      expect(dashboardItem.textContent).toContain('Dasbor Kerja');

      expect(profileItem).toBeTruthy();
      expect(profileItem.textContent).toContain('Profil Publik');

      expect(logoutItem).toBeTruthy();
      expect(logoutItem.textContent).toContain('Keluar');
    });

    it('harus membuka modal konfirmasi saat opsi Keluar diklik', () => {
      const accountTrigger = fixture.nativeElement.querySelector('#accountMenuTrigger');
      accountTrigger.click();
      fixture.detectChanges();

      const logoutItem = fixture.nativeElement.querySelector('#menuItemLogout');
      logoutItem.click();
      fixture.detectChanges();

      expect(component.isLogoutModalOpen()).toBe(true);
      const modalDialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      expect(modalDialog).toBeTruthy();
      expect(modalDialog.textContent).toContain('Konfirmasi Keluar Akun');
    });

    it('harus mengeksekusi logout dan navigasi ke /login saat konfirmasi disetujui', () => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const logoutSpy = jest.spyOn(authService, 'logout');

      component.executeLogout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      expect(component.isLogoutModalOpen()).toBe(false);
    });

    it('harus menutup menu dropdown saat tombol Escape ditekan', () => {
      const accountTrigger = fixture.nativeElement.querySelector('#accountMenuTrigger');
      accountTrigger.click();
      fixture.detectChanges();

      expect(component.isMenuOpen()).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(component.isMenuOpen()).toBe(false);
    });

    it('harus menutup menu dropdown saat backdrop luar diklik', () => {
      const accountTrigger = fixture.nativeElement.querySelector('#accountMenuTrigger');
      accountTrigger.click();
      fixture.detectChanges();

      expect(component.isMenuOpen()).toBe(true);

      const backdrop = fixture.nativeElement.querySelector('button[aria-label="Tutup Menu Akun"]');
      expect(backdrop).toBeTruthy();
      backdrop.click();
      fixture.detectChanges();

      expect(component.isMenuOpen()).toBe(false);
    });
  });
});

