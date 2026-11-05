import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { HomePageComponent } from './home-page.component';
import { AuthService } from '../../../../auth/services/auth.service';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([]), AuthService, Title, Meta],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen beranda', () => {
    expect(component).toBeTruthy();
  });

  it('harus mengatur judul dokumen dan OpenGraph meta tags untuk beranda', () => {
    expect(titleService.getTitle()).toBe(
      'Tuwaktu - Temukan Teknisi Terverifikasi Tanpa Komisi Perantara'
    );
    const ogTitle = metaService.getTag("property='og:title'");
    expect(ogTitle?.content).toBe(
      'Tuwaktu - Temukan Teknisi Terverifikasi Tanpa Komisi Perantara'
    );
  });

  it('harus merender seluruh blok antarmuka utama beranda', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-auth-header-nav')).toBeTruthy();
    expect(el.querySelector('app-home-hero-section')).toBeTruthy();
    expect(el.querySelector('app-home-disciplines-section')).toBeTruthy();
    expect(el.querySelector('app-home-featured-workers-section')).toBeTruthy();
    expect(el.querySelector('app-home-comparison-section')).toBeTruthy();
    expect(el.querySelector('app-home-workflow-section')).toBeTruthy();
    expect(el.querySelector('app-home-simulator-section')).toBeTruthy();
    expect(el.querySelector('app-home-testimonials-section')).toBeTruthy();
    expect(el.querySelector('app-home-faq-section')).toBeTruthy();
    expect(el.querySelector('app-home-footer-section')).toBeTruthy();
  });

  it('harus memproses event onHeroSearch tanpa error', () => {
    const scrollSpy = jest.fn();
    const section = fixture.nativeElement.querySelector('#spesialis-unggulan');
    if (section) {
      section.scrollIntoView = scrollSpy;
    }

    component.onHeroSearch();

    if (section) {
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    }
  });
});
