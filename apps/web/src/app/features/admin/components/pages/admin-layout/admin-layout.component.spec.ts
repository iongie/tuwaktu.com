import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../../../auth/services/auth.service';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
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
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen layout admin', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender admin sidebar dan admin header', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-admin-sidebar')).toBeTruthy();
    expect(el.querySelector('app-admin-header')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('harus mengubah isMobileSidebarOpen saat toggleMobileSidebar dipanggil', () => {
    expect(component.isMobileSidebarOpen()).toBe(false);

    component.toggleMobileSidebar();
    expect(component.isMobileSidebarOpen()).toBe(true);

    component.closeMobileSidebar();
    expect(component.isMobileSidebarOpen()).toBe(false);
  });
});

