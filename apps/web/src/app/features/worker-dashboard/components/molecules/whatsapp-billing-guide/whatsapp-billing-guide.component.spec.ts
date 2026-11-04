import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatsAppBillingGuideComponent } from './whatsapp-billing-guide.component';

describe('WhatsAppBillingGuideComponent', () => {
  let component: WhatsAppBillingGuideComponent;
  let fixture: ComponentFixture<WhatsAppBillingGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsAppBillingGuideComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsAppBillingGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance molekul panduan penagihan', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan judul protokol penagihan mandiri', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Protokol Penagihan Mandiri');
    expect(compiled.textContent).toContain('Konfirmasi Ketersediaan');
    expect(compiled.textContent).toContain('Kirim Rekening Bank / QRIS Pribadi');
  });
});
