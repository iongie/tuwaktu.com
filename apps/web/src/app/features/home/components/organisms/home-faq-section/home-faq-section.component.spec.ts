import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeFaqSectionComponent } from './home-faq-section.component';

describe('HomeFaqSectionComponent', () => {
  let component: HomeFaqSectionComponent;
  let fixture: ComponentFixture<HomeFaqSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeFaqSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeFaqSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen FAQ dengan daftar 5 pertanyaan', () => {
    expect(component).toBeTruthy();
    expect(component.faqs.length).toBe(5);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Pertanyaan yang Sering Diajukan');
    expect(el.textContent).toContain('Apakah Tuwaktu benar-benar tidak memotong komisi sama sekali?');
  });

  it('harus membuka item FAQ pertama secara default', () => {
    expect(component.openFaqId()).toBe('faq-1');
  });

  it('harus beralih status buka/tutup saat toggleFaq dipanggil', () => {
    component.toggleFaq('faq-2');
    expect(component.openFaqId()).toBe('faq-2');

    component.toggleFaq('faq-2');
    expect(component.openFaqId()).toBeNull();
  });
});
