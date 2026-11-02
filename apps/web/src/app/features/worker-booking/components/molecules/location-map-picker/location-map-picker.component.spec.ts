import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { LocationMapPickerComponent } from './location-map-picker.component';

describe('LocationMapPickerComponent', () => {
  let component: LocationMapPickerComponent;
  let componentRef: ComponentRef<LocationMapPickerComponent>;
  let fixture: ComponentFixture<LocationMapPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationMapPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationMapPickerComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen pemilih lokasi peta', () => {
    expect(component).toBeTruthy();
  });

  it('harus menghasilkan URL iframe OpenStreetMap ketika koordinat latitude dan longitude terisi', () => {
    componentRef.setInput('latitude', -6.2443);
    componentRef.setInput('longitude', 106.7997);
    fixture.detectChanges();

    const safeUrl = component.sanitizedMapEmbedUrl();
    expect(safeUrl).not.toBeNull();
  });

  it('harus mengembalikan null untuk URL peta jika salah satu koordinat belum terisi', () => {
    componentRef.setInput('latitude', null);
    componentRef.setInput('longitude', null);
    fixture.detectChanges();

    expect(component.sanitizedMapEmbedUrl()).toBeNull();
  });

  it('harus memancarkan event coordinatesChange ketika memilih salah satu preset area', () => {
    let emittedCoords: { lat: number; lng: number } | null = null;
    component.coordinatesChange.subscribe((coords) => {
      emittedCoords = coords;
    });

    const jakselPreset = component.jabodetabekPresets[0];
    component.applyPresetCoordinate(jakselPreset);

    expect(emittedCoords).toEqual({
      lat: jakselPreset.lat,
      lng: jakselPreset.lng,
    });
    expect(component.geolocationFeedback()?.message).toContain('Jaksel (Blok M)');
  });

  it('harus memancarkan perubahan koordinat ketika input manual latitude diubah', () => {
    componentRef.setInput('longitude', 106.8272);
    fixture.detectChanges();

    let emittedCoords: { lat: number; lng: number } | null = null;
    component.coordinatesChange.subscribe((coords) => {
      emittedCoords = coords;
    });

    component.onLatitudeInputChanged(-6.2001);
    expect(emittedCoords).toEqual({ lat: -6.2001, lng: 106.8272 });
  });

  it('harus memancarkan perubahan koordinat ketika input manual longitude diubah', () => {
    componentRef.setInput('latitude', -6.1754);
    fixture.detectChanges();

    let emittedCoords: { lat: number; lng: number } | null = null;
    component.coordinatesChange.subscribe((coords) => {
      emittedCoords = coords;
    });

    component.onLongitudeInputChanged(106.8500);
    expect(emittedCoords).toEqual({ lat: -6.1754, lng: 106.8500 });
  });
});
