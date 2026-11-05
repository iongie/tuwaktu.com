import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { BookingNavAccountMenuComponent } from './booking-nav-account-menu.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';

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
    bio: 'Teknisi HVAC',
    avatar_url: 'https://example.com/avatar.jpg',
    rating: 4.9,
    review_count: 10,
    zone: 'Jagakarsa, Jakarta Selatan',
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
    it('harus menampilkan tombol Masuk dan Daftar Mitra yang terlihat jelas', () => {
      const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
      const registerBtn = fixture.nativeElement.querySelector('#navRegisterBtn');

      expect(loginBtn).toBeTruthy();
      expect(loginBtn.textContent).toContain('Masuk');
      expect(loginBtn.classList.contains('sr-only')).toBe(false);
      expect(loginBtn.getAttribute('routerLink') || loginBtn.getAttribute('href')).toContain('/login');

      expect(registerBtn).toBeTruthy();
      expect(registerBtn.textContent).toContain('Daftar Mitra');
      expect(registerBtn.classList.contains('sr-only')).toBe(false);
      expect(registerBtn.getAttribute('routerLink') || registerBtn.getAttribute('href')).toContain('/register');
    });

    it('tidak boleh merender profil fiktif Budi Santoso atau dropdown menu akun saat belum login', () => {
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      const dropdownMenu = fixture.nativeElement.querySelector('[role="menu"]');

      expect(userProfileBtn).toBeNull();
      expect(dropdownMenu).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Budi Santoso');
      expect(fixture.nativeElement.textContent).not.toContain('Teknisi HVAC');
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

    it('harus menyembunyikan tombol tamu Masuk/Daftar dan menampilkan trigger menu akun profil mitra', () => {
      const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
      const registerBtn = fixture.nativeElement.querySelector('#navRegisterBtn');
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');

      expect(loginBtn).toBeNull();
      expect(registerBtn).toBeNull();
      expect(userProfileBtn).toBeTruthy();
      expect(userProfileBtn.textContent).toContain('Sarah Melinda');
      expect(userProfileBtn.textContent).toContain('Mitra');
    });

    it('harus membuka elevated dropdown menu saat trigger avatar diklik', () => {
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      userProfileBtn.click();
      fixture.detectChanges();

      const dashboardItem = fixture.nativeElement.querySelector('#menuItemDashboard');
      const ratesItem = fixture.nativeElement.querySelector('#menuItemRates');
      const scheduleItem = fixture.nativeElement.querySelector('#menuItemSchedule');
      const switchAccountItem = fixture.nativeElement.querySelector('#menuItemSwitchAccount');
      const logoutItem = fixture.nativeElement.querySelector('#menuItemLogout');

      expect(dashboardItem).toBeTruthy();
      expect(dashboardItem.textContent).toContain('Ke Dashboard Teknisi');

      expect(ratesItem).toBeTruthy();
      expect(ratesItem.textContent).toContain('Pengaturan Profil & Tarif Mandiri');

      expect(scheduleItem).toBeTruthy();
      expect(scheduleItem.textContent).toContain('Kelola Jadwal & Buffer Transit');

      expect(switchAccountItem).toBeTruthy();
      expect(switchAccountItem.textContent).toContain('Masuk Akun Lain');

      expect(logoutItem).toBeTruthy();
      expect(logoutItem.textContent).toContain('Keluar / Logout');
    });

    it('harus menampilkan opsi Panel Kelola Mitra saat pengguna adalah ADMIN', () => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
      });
      fixture.detectChanges();

      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      userProfileBtn.click();
      fixture.detectChanges();

      const adminItem = fixture.nativeElement.querySelector('#menuItemAdminPanel');
      expect(adminItem).toBeTruthy();
      expect(adminItem.textContent).toContain('Panel Kelola Mitra');
    });

    it('harus membuka modal konfirmasi saat opsi Keluar diklik', () => {
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      userProfileBtn.click();
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
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      userProfileBtn.click();
      fixture.detectChanges();

      expect(component.isMenuOpen()).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(component.isMenuOpen()).toBe(false);
    });

    it('harus menutup menu dropdown saat backdrop luar diklik', () => {
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      userProfileBtn.click();
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
