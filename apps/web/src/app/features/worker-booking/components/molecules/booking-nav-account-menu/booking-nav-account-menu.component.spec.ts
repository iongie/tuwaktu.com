import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
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
          { path: 'admin/workers', component: DummyLoginComponent },
          { path: 'dashboard/ringkasan', component: DummyLoginComponent },
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

  describe('Kondisi 0: Loading Sesi saat Refresh (isInitialized === false)', () => {
    it('harus menampilkan skeleton loading dan menyembunyikan tombol tamu atau menu profil', () => {
      authService.isInitialized.set(false);
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('[data-testid="nav-session-skeleton"]');
      const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
      const workerMenu = fixture.nativeElement.querySelector('[data-testid="nav-worker-menu"]');
      const adminMenu = fixture.nativeElement.querySelector('[data-testid="nav-admin-menu"]');

      expect(skeleton).toBeTruthy();
      expect(loginBtn).toBeNull();
      expect(workerMenu).toBeNull();
      expect(adminMenu).toBeNull();
    });
  });

  describe('Kondisi 1: Tamu Belum Masuk (Guest)', () => {
    beforeEach(() => {
      authService.setSession(null);
      authService.isInitialized.set(true);
      fixture.detectChanges();
    });

    it('harus menampilkan tombol Masuk dan Daftar Mitra', () => {
      const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
      const registerBtn = fixture.nativeElement.querySelector('#navRegisterBtn');

      expect(loginBtn).toBeTruthy();
      expect(loginBtn.textContent).toContain('Masuk');
      expect(registerBtn).toBeTruthy();
      expect(registerBtn.textContent).toContain('Daftar Mitra');
    });

    it('tidak boleh merender profil pekerja atau dropdown akun saat tamu', () => {
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      const dropdownMenu = fixture.nativeElement.querySelector('[role="menu"]');

      expect(userProfileBtn).toBeNull();
      expect(dropdownMenu).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Budi Santoso');
      expect(fixture.nativeElement.textContent).not.toContain('Teknisi HVAC');
    });
  });

  describe('Kondisi 2: Logged-in Worker (Mitra Pekerja)', () => {
    beforeEach(() => {
      authService.setSession({
        id: 'usr-123',
        name: 'Sarah Melinda',
        slug: 'sarah-cleaning',
        role: 'worker',
      });
      fixture.detectChanges();
    });

    it('harus menyembunyikan tombol tamu dan menampilkan trigger menu profil mitra', () => {
      const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');

      expect(loginBtn).toBeNull();
      expect(userProfileBtn).toBeTruthy();
      expect(userProfileBtn.textContent).toContain('Sarah Melinda');
      expect(userProfileBtn.textContent).toContain('Mitra');
    });

    it('harus membuka dropdown menu mitra dengan tautan dasbor teknisi, tarif, slot, dan logout', () => {
      const userProfileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
      userProfileBtn.click();
      fixture.detectChanges();

      const dashboardItem = fixture.nativeElement.querySelector('#menuItemDashboard');
      const ratesItem = fixture.nativeElement.querySelector('#menuItemRates');
      const scheduleItem = fixture.nativeElement.querySelector('#menuItemSchedule');
      const publicProfileItem = fixture.nativeElement.querySelector('#menuItemPublicProfile');
      const logoutItem = fixture.nativeElement.querySelector('#menuItemLogout');

      expect(dashboardItem).toBeTruthy();
      expect(dashboardItem.textContent).toContain('Ke Dashboard Teknisi');

      expect(ratesItem).toBeTruthy();
      expect(ratesItem.textContent).toContain('Pengaturan Profil & Tarif Mandiri');

      expect(scheduleItem).toBeTruthy();
      expect(scheduleItem.textContent).toContain('Kelola Jadwal & Buffer Transit');

      expect(publicProfileItem).toBeTruthy();
      expect(publicProfileItem.textContent).toContain('Profil Publik Saya');

      expect(logoutItem).toBeTruthy();
      expect(logoutItem.textContent).toContain('Keluar / Logout');
    });

    it('harus membuka modal konfirmasi saat opsi Keluar diklik oleh mitra', () => {
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
      const logoutSpy = jest.spyOn(authService, 'logout').mockReturnValue(of(true));

      component.executeLogout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      expect(component.isLogoutModalOpen()).toBe(false);
      expect(component.isMenuOpen()).toBe(false);
    });

    it('harus menampilkan inisial pekerja jika avatar gambar gagal dimuat (broken image)', () => {
      authService.setSession({
        id: 'usr-123',
        name: 'Gigih Santoso',
        slug: 'gigih-santoso',
        role: 'worker',
        avatarUrl: 'https://invalid-url.com/broken-avatar.jpg',
      });
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('#userProfileMenuBtn img');
      expect(img).toBeTruthy();

      // Trigger error pada elemen gambar
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      const imgAfterError = fixture.nativeElement.querySelector('#userProfileMenuBtn img');
      expect(imgAfterError).toBeNull();
      expect(fixture.nativeElement.querySelector('#userProfileMenuBtn').textContent).toContain('GS');
    });
  });

  describe('Kondisi 3: Logged-in Admin (Super Administrator)', () => {
    beforeEach(() => {
      authService.setSession({
        id: 'admin-1',
        name: 'Super Administrator',
        slug: 'admin',
        role: 'ADMIN',
        email: 'admin@tuwaktu.com',
      });
      fixture.detectChanges();
    });

    it('harus merender trigger akun dengan badge ADMIN dan nama admin', () => {
      const adminBtn = fixture.nativeElement.querySelector('#adminProfileMenuBtn');
      expect(adminBtn).toBeTruthy();
      expect(adminBtn.textContent).toContain('Super Administrator');
      expect(adminBtn.textContent).toContain('ADMIN');
    });

    it('harus membuka dropdown khusus admin dengan Panel Kelola Mitra, Web Publik, dan Logout', () => {
      const adminBtn = fixture.nativeElement.querySelector('#adminProfileMenuBtn');
      adminBtn.click();
      fixture.detectChanges();

      const adminItem = fixture.nativeElement.querySelector('#menuItemAdminPanel');
      const publicHomeItem = fixture.nativeElement.querySelector('#menuItemPublicHome');
      const adminLogoutItem = fixture.nativeElement.querySelector('#adminMenuItemLogout');

      expect(adminItem).toBeTruthy();
      expect(adminItem.textContent).toContain('Panel Kelola Mitra');

      expect(publicHomeItem).toBeTruthy();
      expect(publicHomeItem.textContent).toContain('Kembali ke Web Publik');

      expect(adminLogoutItem).toBeTruthy();
      expect(adminLogoutItem.textContent).toContain('Keluar / Logout');

      // Pastikan menu operasional worker tidak bocor ke panel admin
      expect(fixture.nativeElement.querySelector('#menuItemRates')).toBeNull();
      expect(fixture.nativeElement.querySelector('#menuItemSchedule')).toBeNull();
    });

    it('harus mengeksekusi logout admin saat dikonfirmasi', () => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const logoutSpy = jest.spyOn(authService, 'logout').mockReturnValue(of(true));

      component.executeLogout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
