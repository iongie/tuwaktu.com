import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkerLoginPageComponent } from './worker-login-page.component';
import { AuthService } from '../../../services/auth.service';

describe('WorkerLoginPageComponent', () => {
  let fixture: ComponentFixture<WorkerLoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerLoginPageComponent],
      providers: [provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerLoginPageComponent);
    fixture.detectChanges();
  });

  it('harus merender seluruh elemen halaman masuk konsol mandiri pekerja', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Kedaulatan Penuh Akses Pekerja Mandiri.');
    expect(text).toContain('PROTOKOL AUTENTIKASI KEDAULATAN');
    expect(text).toContain('STATUS SISTEM DISPATCH');
    expect(text).toContain('Enkripsi Mandiri End-to-End');
    expect(text).toContain('Sinkronisasi Slot Kalender Seketika');
    expect(text).toContain('Jalur Cepat WhatsApp Dispatch');
    expect(text).toContain('Masuk ke Konsol Mandiri');
  });
});
