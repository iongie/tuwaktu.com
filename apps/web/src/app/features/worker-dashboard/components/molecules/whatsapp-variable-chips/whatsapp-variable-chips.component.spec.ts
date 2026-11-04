import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  WhatsAppVariableChipsComponent,
  WHATSAPP_TEMPLATE_VARIABLES,
} from './whatsapp-variable-chips.component';

describe('WhatsAppVariableChipsComponent', () => {
  let component: WhatsAppVariableChipsComponent;
  let fixture: ComponentFixture<WhatsAppVariableChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsAppVariableChipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsAppVariableChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance molekul chips variabel', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender seluruh variabel dinamis yang tersedia', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons.length).toBe(WHATSAPP_TEMPLATE_VARIABLES.length);
  });

  it('harus meng-emit token saat tombol variabel diklik', () => {
    let selectedToken = '';
    component.tokenSelected.subscribe((token) => {
      selectedToken = token;
    });

    component.selectToken('{{NAMA_KLIEN}}');
    expect(selectedToken).toBe('{{NAMA_KLIEN}}');
  });
});
