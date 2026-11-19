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
    expect(text).toContain('Daftar Jadi Mitra Jasa Mandiri');
    expect(text).toContain('PENDAFTARAN MITRA TUWAKTU');
    expect(text).toContain('LANGKAH 01');
    expect(text).toContain('LANGKAH 02');
    expect(text).toContain('LANGKAH 03');
    expect(text).toContain('0% Biaya Komisi');
    expect(text).toContain('Jeda Waktu Otomatis');
    expect(text).toContain('Pesanan Masuk ke WhatsApp');
  });
});
