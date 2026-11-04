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
    expect(compiled.textContent).toContain('Jl. Tebet Timur Dalam Raya No. 18');
    expect(compiled.textContent).toContain('-6.234129, 106.852901');
    expect(compiled.textContent).toContain('GPS Presisi Aktif');
    expect(compiled.textContent).toContain('Titik Nol Pangkalan Aktif');
  });

  it('harus meng-emit koordinat baru saat preset area dipilih', () => {
    jest.spyOn(component.coordinatesChange, 'emit');
    const preset = component.presets[1]; // Blok M
    component.applyPresetCoordinate(preset);

    expect(component.coordinatesChange.emit).toHaveBeenCalledWith({
      lat: preset.lat,
      lng: preset.lng,
    });
  });

  it('harus membuka dan menutup mode edit peta saat toggleEditLocation dipanggil', () => {
    expect(component.isEditLocationOpen()).toBe(false);
    component.toggleEditLocation();
    expect(component.isEditLocationOpen()).toBe(true);
    component.toggleEditLocation();
    expect(component.isEditLocationOpen()).toBe(false);
  });
});
