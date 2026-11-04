import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerRatesGuidelinesSidebarComponent } from './worker-rates-guidelines-sidebar.component';

describe('WorkerRatesGuidelinesSidebarComponent', () => {
  let fixture: ComponentFixture<WorkerRatesGuidelinesSidebarComponent>;
  let component: WorkerRatesGuidelinesSidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerRatesGuidelinesSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerRatesGuidelinesSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance sidebar panduan tarif', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender status verifikasi katalog', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('STATUS VERIFIKASI KATALOG');
    expect(el.textContent).toContain('kalkulator otomatis pada formulir pemesanan WhatsApp');
  });
});
