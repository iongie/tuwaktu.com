import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthDispatchSimulatorCardComponent } from './auth-dispatch-simulator-card.component';

describe('AuthDispatchSimulatorCardComponent', () => {
  let fixture: ComponentFixture<AuthDispatchSimulatorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthDispatchSimulatorCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthDispatchSimulatorCardComponent);
  });

  it('harus merender simulasi pesan WA dengan label spesialisasi dan basecamp yang diberikan', () => {
    fixture.componentRef.setInput('specialtyLabel', 'Teknisi AC & Kelistrikan');
    fixture.componentRef.setInput('basecamp', 'Kebayoran Baru');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Teknisi AC & Kelistrikan');
    expect(text).toContain('Kebayoran Baru');
    expect(text).toContain('SIMULASI FORMAT DISPATCH');
    expect(text).toContain('Komisi Tuwaktu: Rp 0');
  });

  it('harus merender fallback "Basecamp Terdaftar" jika basecamp belum ditentukan', () => {
    fixture.componentRef.setInput('specialtyLabel', 'Spesialis Kebersihan Hunian');
    fixture.componentRef.setInput('basecamp', '');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Basecamp Terdaftar');
  });
});
