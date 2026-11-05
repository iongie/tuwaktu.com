import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HomeHeroSectionComponent } from './home-hero-section.component';

describe('HomeHeroSectionComponent', () => {
  let component: HomeHeroSectionComponent;
  let fixture: ComponentFixture<HomeHeroSectionComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHeroSectionComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHeroSectionComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen hero beranda dengan telemetri', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Protokol Kedaulatan Pekerja Mandiri • 0% Komisi');
    expect(el.textContent).toContain('Cari Spesialis Terverifikasi.');
  });

  it('harus merender 4 pilar kepercayaan Tuwaktu', () => {
    expect(component.trustPillars.length).toBe(4);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('0% Potongan Komisi');
    expect(el.textContent).toContain('100% WhatsApp Langsung');
    expect(el.textContent).toContain('Buffer Transit Otomatis');
    expect(el.textContent).toContain('Kredensial Terverifikasi');
  });

  it('harus menavigasi ke /sarah-cleaning saat pencarian menyebut nama Sarah', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const emitSpy = jest.spyOn(component.searchTrigger, 'emit');

    component.specialtyQuery.set('Sarah Melinda');
    component.handleSearchSubmit();

    expect(navSpy).toHaveBeenCalledWith(['/sarah-cleaning']);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('harus menavigasi ke /budi-santoso saat pencarian menyebut nama Budi', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.specialtyQuery.set('Budi');
    component.handleSearchSubmit();

    expect(navSpy).toHaveBeenCalledWith(['/budi-santoso']);
  });

  it('harus menavigasi ke /hendra-listrik saat pencarian menyebut nama Hendra', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.specialtyQuery.set('Hendra');
    component.handleSearchSubmit();

    expect(navSpy).toHaveBeenCalledWith(['/hendra-listrik']);
  });

  it('harus menavigasi ke /rian-audio saat pencarian menyebut nama Rian', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.specialtyQuery.set('Rian');
    component.handleSearchSubmit();

    expect(navSpy).toHaveBeenCalledWith(['/rian-audio']);
  });

  it('harus memancarkan searchTrigger saat pencarian umum dilakukan', () => {
    const emitSpy = jest.spyOn(component.searchTrigger, 'emit');

    component.specialtyQuery.set('Teknisi Umum');
    component.locationQuery.set('Tebet');
    component.handleSearchSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      specialty: 'Teknisi Umum',
      location: 'Tebet',
    });
  });

  it('harus memperbarui specialtyQuery dan submit saat filter chip diklik', () => {
    const submitSpy = jest.spyOn(component, 'handleSearchSubmit');

    component.applyFilterChip('ac');

    expect(component.specialtyQuery()).toBe('ac');
    expect(submitSpy).toHaveBeenCalled();
  });
});
