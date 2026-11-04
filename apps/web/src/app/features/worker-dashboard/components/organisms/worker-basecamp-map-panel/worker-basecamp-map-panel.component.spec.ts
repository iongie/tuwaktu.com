import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerBasecampMapPanelComponent } from './worker-basecamp-map-panel.component';

describe('WorkerBasecampMapPanelComponent', () => {
  let component: WorkerBasecampMapPanelComponent;
  let fixture: ComponentFixture<WorkerBasecampMapPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerBasecampMapPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerBasecampMapPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance panel peta basecamp', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender koordinat dan alamat basecamp', () => {
    fixture.componentRef.setInput('latitude', -6.234129);
    fixture.componentRef.setInput('longitude', 106.852901);
    fixture.componentRef.setInput(
      'address',
      'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan'
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const addressInput = compiled.querySelector('#basecamp-address-input') as HTMLInputElement;
    expect(addressInput.value).toBe(
      'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan'
    );
    expect(compiled.textContent).toContain('-6.234129, 106.852901');
    expect(compiled.textContent).toContain('GPS Presisi Aktif');
    expect(compiled.textContent).toContain('Titik Nol Pangkalan Aktif');
  });

  it('harus meng-emit koordinat baru dan alamat saat preset area dipilih', () => {
    jest.spyOn(component.coordinatesChange, 'emit');
    jest.spyOn(component.addressChange, 'emit');
    const preset = component.presets[1]; // Blok M
    component.applyPresetCoordinate(preset);

    expect(component.coordinatesChange.emit).toHaveBeenCalledWith({
      lat: preset.lat,
      lng: preset.lng,
    });
    expect(component.addressChange.emit).toHaveBeenCalledWith(preset.address);
  });

  it('harus meng-emit addressChange saat input alamat diubah', () => {
    jest.spyOn(component.addressChange, 'emit');
    component.onAddressInput('Jl. Fatmawati No. 25, Cilandak');
    expect(component.addressChange.emit).toHaveBeenCalledWith(
      'Jl. Fatmawati No. 25, Cilandak'
    );
  });

  it('harus menghitung diameter lingkaran radar jangkauan secara proporsional', () => {
    fixture.componentRef.setInput('freeRadiusKm', 3.0);
    fixture.componentRef.setInput('maxRadiusKm', 5.0);
    fixture.detectChanges();

    expect(component.radarMaxDiameterPx()).toBeGreaterThan(0);
    expect(component.radarFreeDiameterPx()).toBeGreaterThan(0);
    expect(component.radarMaxDiameterPx()).toBeGreaterThanOrEqual(
      component.radarFreeDiameterPx()
    );
  });

  it('harus beralih tab antara Radar Jangkauan dan Peta Interaktif', () => {
    expect(component.activeMapTab()).toBe('RADAR');
    component.setMapTab('INTERACTIVE');
    expect(component.activeMapTab()).toBe('INTERACTIVE');
    component.setMapTab('RADAR');
    expect(component.activeMapTab()).toBe('RADAR');
  });

  it('harus membuka dan menutup mode koordinat manual saat toggleEditLocation dipanggil', () => {
    expect(component.isEditLocationOpen()).toBe(false);
    component.toggleEditLocation();
    expect(component.isEditLocationOpen()).toBe(true);
    component.toggleEditLocation();
    expect(component.isEditLocationOpen()).toBe(false);
  });
});
