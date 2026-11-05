import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthHeaderNavComponent } from './auth-header-nav.component';
import { AuthService } from '../../../services/auth.service';

describe('AuthHeaderNavComponent', () => {
  let component: AuthHeaderNavComponent;
  let fixture: ComponentFixture<AuthHeaderNavComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthHeaderNavComponent],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthHeaderNavComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('harus merender logo merek TUWAKTU MANDIRI yang mengarah ke beranda', () => {
    const brandLink = fixture.nativeElement.querySelector('a[aria-label="Kembali ke Beranda Tuwaktu"]');
    expect(brandLink).toBeTruthy();
    expect(brandLink.textContent).toContain('TUWAKTU');
    expect(brandLink.textContent).toContain('MANDIRI');
  });

  it('harus merender badge Verifikasi Pekerja', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Verifikasi Pekerja');
  });

  it('harus merender link navigasi utama yang selaras dengan beranda', () => {
    const navLinks = fixture.nativeElement.querySelectorAll('nav a');
    const navTexts = Array.from(navLinks).map((el: Element) => el.textContent?.trim());

    expect(navTexts).toContain('Jelajah Pekerja');
    expect(navTexts).toContain('Katalog Layanan');
    expect(navTexts).toContain('Tentang Mandiri');
  });

  it('harus merender komponen dropdown profil akun pengguna (BookingNavAccountMenuComponent)', () => {
    const accountMenu = fixture.nativeElement.querySelector('app-booking-nav-account-menu');
    expect(accountMenu).toBeTruthy();
  });

  it('harus menampilkan tombol Masuk dan Daftar Mitra di navbar saat pengguna belum login', () => {
    const authService = TestBed.inject(AuthService);
    authService.setSession(null);
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

  it('harus melakukan navigasi ke profil pekerja saat executeTechnicianLookup dipanggil', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.searchTechnicianSlug.set('sarah-cleaning');
    component.executeTechnicianLookup();

    expect(navSpy).toHaveBeenCalledWith(['/', 'sarah-cleaning']);
  });

  it('harus melakukan navigasi cerdas ke profil pekerja spesifik atau katalog disiplin', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.searchTechnicianSlug.set('budi');
    component.executeTechnicianLookup();
    expect(navSpy).toHaveBeenCalledWith(['/', 'budi-santoso']);

    component.searchTechnicianSlug.set('ac');
    component.executeTechnicianLookup();
    expect(navSpy).toHaveBeenCalledWith(['/'], { fragment: 'katalog-disiplin' });
  });

  it('tidak boleh melakukan navigasi jika query pencarian kosong', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.searchTechnicianSlug.set('   ');
    component.executeTechnicianLookup();

    expect(navSpy).not.toHaveBeenCalled();
  });
});
