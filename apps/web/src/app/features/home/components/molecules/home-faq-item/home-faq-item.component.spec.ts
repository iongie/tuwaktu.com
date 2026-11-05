import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeFaqItemComponent } from './home-faq-item.component';
import { FaqItem } from '../../../models/home.model';

describe('HomeFaqItemComponent', () => {
  let component: HomeFaqItemComponent;
  let fixture: ComponentFixture<HomeFaqItemComponent>;

  const mockFaq: FaqItem = {
    id: 'faq-1',
    question: 'Apakah Tuwaktu memotong komisi?',
    answer: 'Tidak sama sekali. 100% biaya jasa diterima langsung oleh teknisi.',
    category: 'Biaya',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeFaqItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeFaqItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('faq', mockFaq);
    fixture.detectChanges();
  });

  it('harus merender pertanyaan FAQ dalam tombol interaktif', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Apakah Tuwaktu memotong komisi?');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('harus menyembunyikan jawaban saat isOpen bernilai false', () => {
    const panel = fixture.nativeElement.querySelector('#faq-panel-faq-1');
    expect(panel).toBeNull();
  });

  it('harus merender jawaban saat isOpen bernilai true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('#faq-panel-faq-1');
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('100% biaya jasa diterima langsung oleh teknisi.');
  });

  it('harus memancarkan event toggle saat tombol diklik', () => {
    const toggleSpy = jest.fn();
    component.toggleItem.subscribe(toggleSpy);

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });
});
