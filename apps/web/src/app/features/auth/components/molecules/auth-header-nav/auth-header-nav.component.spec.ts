import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthHeaderNavComponent } from './auth-header-nav.component';

describe('AuthHeaderNavComponent', () => {
  let fixture: ComponentFixture<AuthHeaderNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthHeaderNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthHeaderNavComponent);
  });

  it('harus merender navigasi dengan tab register aktif saat activeTab bernilai register', () => {
    fixture.componentRef.setInput('activeTab', 'register');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const registerLink = compiled.querySelector('a[href="/register"]');
    const loginLink = compiled.querySelector('a[href="/login"]');

    expect(registerLink).not.toBeNull();
    expect(registerLink?.getAttribute('aria-current')).toBe('page');
    expect(registerLink?.classList.contains('bg-primary')).toBe(true);

    expect(loginLink).not.toBeNull();
    expect(loginLink?.getAttribute('aria-current')).toBeNull();
    expect(loginLink?.classList.contains('bg-primary')).toBe(false);
  });

  it('harus merender navigasi dengan tab login aktif saat activeTab bernilai login', () => {
    fixture.componentRef.setInput('activeTab', 'login');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const registerLink = compiled.querySelector('a[href="/register"]');
    const loginLink = compiled.querySelector('a[href="/login"]');

    expect(loginLink?.getAttribute('aria-current')).toBe('page');
    expect(loginLink?.classList.contains('bg-primary')).toBe(true);
    expect(registerLink?.getAttribute('aria-current')).toBeNull();
  });
});
