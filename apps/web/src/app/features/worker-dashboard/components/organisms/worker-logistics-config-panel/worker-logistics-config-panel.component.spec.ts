import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerLogisticsConfigPanelComponent } from './worker-logistics-config-panel.component';

describe('WorkerLogisticsConfigPanelComponent', () => {
  let component: WorkerLogisticsConfigPanelComponent;
  let fixture: ComponentFixture<WorkerLogisticsConfigPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerLogisticsConfigPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerLogisticsConfigPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance panel konfigurasi logistik', () => {
    expect(component).toBeTruthy();
  });

  it('harus meng-emit perubahan radius bebas ongkir', () => {
    jest.spyOn(component.freeRadiusKmChange, 'emit');
    component.onFreeRadiusInput(4.5);
    expect(component.freeRadiusKmChange.emit).toHaveBeenCalledWith(4.5);
  });

  it('harus meng-emit perubahan biaya tambahan per km', () => {
    jest.spyOn(component.extraFeePerKmChange, 'emit');
    component.onExtraFeeInput(4000);
    expect(component.extraFeePerKmChange.emit).toHaveBeenCalledWith(4000);
  });

  it('harus meng-emit perubahan batas jangkauan maksimal', () => {
    jest.spyOn(component.maxRadiusKmChange, 'emit');
    component.onMaxRadiusInput(12.0);
    expect(component.maxRadiusKmChange.emit).toHaveBeenCalledWith(12.0);
  });
});
