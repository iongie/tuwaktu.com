import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerServiceLivePreviewCardComponent } from './worker-service-live-preview-card.component';

describe('WorkerServiceLivePreviewCardComponent', () => {
  let component: WorkerServiceLivePreviewCardComponent;
  let fixture: ComponentFixture<WorkerServiceLivePreviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerServiceLivePreviewCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerServiceLivePreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen pratinjau live', () => {
    expect(component).toBeTruthy();
  });

  it('harus memformat nominal harga dengan format id-ID', () => {
    fixture.componentRef.setInput('price', 125000);
    fixture.detectChanges();
    expect(component.formattedPrice()).toBe('125.000');
    expect(fixture.nativeElement.textContent).toContain('125.000');
  });

  it('harus merender nama layanan dan kategori yang dimasukkan', () => {
    fixture.componentRef.setInput('name', 'Pembersihan AC Split Presisi');
    fixture.componentRef.setInput('categoryName', 'Servis & Pasang AC');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Pembersihan AC Split Presisi');
    expect(text).toContain('Servis & Pasang AC');
  });

  it('harus merender status draf dan rate type per paket', () => {
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.componentRef.setInput('rateType', 'UNIT');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Draf Pribadi');
    expect(text).toContain('/ paket');
  });
});

