import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkerRegisterPageComponent } from './worker-register-page.component';
import { AuthService } from '../../../services/auth.service';

describe('WorkerRegisterPageComponent', () => {
  let fixture: ComponentFixture<WorkerRegisterPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerRegisterPageComponent],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerRegisterPageComponent);
    fixture.detectChanges();
  });

  it('harus merender seluruh elemen halaman registrasi mandiri pekerja', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mulai Bisnis Jasa Mandiri Anda');
    expect(text).toContain('Direct Sovereign Onboarding');
    expect(text).toContain('FASE 01');
    expect(text).toContain('FASE 02');
    expect(text).toContain('FASE 03');
    expect(text).toContain('0% Komisi Selamanya');
    expect(text).toContain('Anti-Bentrok & Buffer Otomatis');
    expect(text).toContain('Direct WhatsApp Handoff');
  });
});
