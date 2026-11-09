import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AuthService } from '../../../../auth/services/auth.service';

describe('AdminSidebarComponent', () => {
  let component: AdminSidebarComponent;
  let fixture: ComponentFixture<AdminSidebarComponent>;
  let mockAuthService: { logout: jest.Mock };

  beforeEach(async () => {
    mockAuthService = {
      logout: jest.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [AdminSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen sidebar admin', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender 3 menu inti admin dan menu pintasan bawah', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Analitik Platform');
    expect(el.textContent).toContain('Kelola Mitra');
    expect(el.textContent).toContain('Katalog Keahlian');
    expect(el.textContent).toContain('Lihat Web Publik');
    expect(el.textContent).toContain('Dashboard Teknisi');
    expect(el.textContent).toContain('Keluar Akun');
  });

  it('harus memancarkan closeMobile saat backdrop diklik pada mobile', () => {
    fixture.componentRef.setInput('isMobileOpen', true);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.closeMobile, 'emit');
    const backdrop = fixture.nativeElement.querySelector('button[aria-label="Tutup Bilah Navigasi Admin"]');
    expect(backdrop).toBeTruthy();

    backdrop?.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus membuka modal logout saat tombol keluar akun diklik', () => {
    const logoutBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.text-error');
    expect(logoutBtn).toBeTruthy();

    logoutBtn?.click();
    expect(component.isLogoutModalOpen()).toBe(true);
  });
});

