import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthHeaderNavComponent } from './auth-header-nav.component';
import { AuthService } from '../../../services/auth.service';

describe('AuthHeaderNavComponent', () => {
  let component: AuthHeaderNavComponent;
  let fixture: ComponentFixture<AuthHeaderNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthHeaderNavComponent],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthHeaderNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus merender logo merek TUWAKTU MANDIRI yang mengarah ke beranda', () => {
    const brandLink = fixture.nativeElement.querySelector('a[aria-label="Kembali ke Beranda Tuwaktu"]');
    expect(brandLink).toBeTruthy();
    expect(brandLink.textContent).toContain('TUWAKTU');
    expect(brandLink.textContent).toContain('MANDIRI');
  });

  it('harus merender 4 tautan navigasi utama desktop tanpa badge atau search dummy', () => {
    const navLinks = fixture.nativeElement.querySelectorAll('nav a');
    const navTexts = Array.from(navLinks).map((el: Element) => el.textContent?.trim());

    expect(navTexts).toContain('Jelajah Pekerja');
    expect(navTexts).toContain('Katalog Layanan');
    expect(navTexts).toContain('Untuk Bisnis');
    expect(navTexts).toContain('Tentang Mandiri');
    expect(fixture.nativeElement.textContent).not.toContain('Verifikasi Pekerja');
  });

  it('harus dapat membuka dan menutup menu navigasi mobile serta tombol daftar saat tamu', () => {
    const authService = TestBed.inject(AuthService);
    authService.setSession(null);
    authService.isInitialized.set(true);
    fixture.detectChanges();

    const menuBtn = fixture.nativeElement.querySelector(
      '[data-testid="mobile-nav-menu-btn"]',
    ) as HTMLButtonElement;
    expect(menuBtn).toBeTruthy();

    menuBtn.click();
    fixture.detectChanges();

    const mobileNav = fixture.nativeElement.querySelector('#mobile-primary-nav');
    expect(mobileNav).toBeTruthy();
    expect(mobileNav.textContent).toContain('Untuk Bisnis');
    expect(
      fixture.nativeElement.querySelector('[data-testid="mobile-drawer-register-btn"]'),
    ).toBeTruthy();

    component.closeMobileMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#mobile-primary-nav')).toBeNull();
  });

  it('harus merender komponen dropdown profil akun pengguna (BookingNavAccountMenuComponent)', () => {
    const accountMenu = fixture.nativeElement.querySelector('app-booking-nav-account-menu');
    expect(accountMenu).toBeTruthy();
  });

  it('harus menampilkan skeleton loading di navbar saat sesi belum terinisialisasi', () => {
    const authService = TestBed.inject(AuthService);
    authService.isInitialized.set(false);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('[data-testid="nav-session-skeleton"]');
    expect(skeleton).toBeTruthy();
  });

  it('harus menampilkan tombol Masuk dan Daftar Mitra di navbar saat pengguna belum login', () => {
    const authService = TestBed.inject(AuthService);
    authService.setSession(null);
    authService.isInitialized.set(true);
    fixture.detectChanges();

    const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');
    const registerBtn = fixture.nativeElement.querySelector('#navRegisterBtn');
    const profileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');

    expect(loginBtn).toBeTruthy();
    expect(registerBtn).toBeTruthy();
    expect(profileBtn).toBeNull();
  });

  it('harus menampilkan profil akun di navbar saat pengguna sudah login', () => {
    const authService = TestBed.inject(AuthService);
    authService.setSession({
      id: 'worker-1',
      name: 'Sarah Melinda',
      slug: 'sarah-cleaning',
      role: 'worker',
    });
    fixture.detectChanges();

    const profileBtn = fixture.nativeElement.querySelector('#userProfileMenuBtn');
    const loginBtn = fixture.nativeElement.querySelector('#navLoginBtn');

    expect(profileBtn).toBeTruthy();
    expect(profileBtn.textContent).toContain('Sarah Melinda');
    expect(loginBtn).toBeNull();
  });
});
