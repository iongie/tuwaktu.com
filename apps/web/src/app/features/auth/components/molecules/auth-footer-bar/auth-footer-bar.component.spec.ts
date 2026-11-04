import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFooterBarComponent } from './auth-footer-bar.component';

describe('AuthFooterBarComponent', () => {
  let fixture: ComponentFixture<AuthFooterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthFooterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthFooterBarComponent);
    fixture.detectChanges();
  });

  it('harus merender teks hak kedaulatan pekerja dan protokol keamanan', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mandiri Penuh. Tanpa Potongan Komisi.');
    expect(compiled.textContent).toContain('END-TO-END VERIFIED');
    expect(compiled.textContent).toContain('Tanpa OAuth Pihak Ketiga');
  });
});
