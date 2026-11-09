import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AdminHeaderComponent } from './admin-header.component';
import { AuthService } from '../../../../auth/services/auth.service';

describe('AdminHeaderComponent', () => {
  let component: AdminHeaderComponent;
  let fixture: ComponentFixture<AdminHeaderComponent>;
  let mockAuthService: {
    isInitialized: ReturnType<typeof signal<boolean>>;
    isLoggedIn: ReturnType<typeof signal<boolean>>;
    currentUser: ReturnType<typeof signal<any>>;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthService = {
      isInitialized: signal(true),
      isLoggedIn: signal(false),
      currentUser: signal(null),
      logout: jest.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [AdminHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen header admin', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender breadcrumb panel admin dan badge Admin Super', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Panel Admin');
    expect(el.textContent).toContain('Admin Super');
  });

  it('harus memancarkan toggleMobileSidebar saat tombol hamburger diklik', () => {
    const emitSpy = jest.spyOn(component.toggleMobileSidebar, 'emit');
    const hamburgerBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button[aria-label="Buka Menu Sidebar"]');
    expect(hamburgerBtn).toBeTruthy();

    hamburgerBtn?.click();
    expect(emitSpy).toHaveBeenCalled();
  });
});

