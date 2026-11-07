import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthSecurityGuaranteeStripComponent } from './auth-security-guarantee-strip.component';

describe('AuthSecurityGuaranteeStripComponent', () => {
  let fixture: ComponentFixture<AuthSecurityGuaranteeStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthSecurityGuaranteeStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthSecurityGuaranteeStripComponent);
    fixture.detectChanges();
  });

  it('harus merender informasi privasi dan keamanan data mandiri', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Data Klien Milik Anda Sepenuhnya');
    expect(text).toContain('Pendaftaran Praktis & Mandiri');
    expect(text).toContain('Privasi & Keamanan Data Terjaga');
  });
});
