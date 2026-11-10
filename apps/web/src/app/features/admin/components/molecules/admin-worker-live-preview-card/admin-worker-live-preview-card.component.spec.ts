import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminWorkerLivePreviewCardComponent } from './admin-worker-live-preview-card.component';

describe('AdminWorkerLivePreviewCardComponent', () => {
  let component: AdminWorkerLivePreviewCardComponent;
  let fixture: ComponentFixture<AdminWorkerLivePreviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkerLivePreviewCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkerLivePreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen pratinjau live mitra', () => {
    expect(component).toBeTruthy();
  });

  it('harus menghasilkan inisial yang tepat dari nama mitra', () => {
    fixture.componentRef.setInput('name', 'Budi Santoso');
    fixture.detectChanges();
    expect(component.initials()).toBe('BS');

    fixture.componentRef.setInput('name', 'Joko');
    fixture.detectChanges();
    expect(component.initials()).toBe('JO');
  });

  it('harus merender nama, profesi, kota, dan slug di kartu', () => {
    fixture.componentRef.setInput('name', 'Budi Santoso');
    fixture.componentRef.setInput('profession', 'Teknisi AC Presisi');
    fixture.componentRef.setInput('city', 'Surabaya');
    fixture.componentRef.setInput('slug', 'budi-santoso');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Budi Santoso');
    expect(text).toContain('Teknisi AC Presisi');
    expect(text).toContain('Surabaya');
    expect(text).toContain('tuwaktu.com/budi-santoso');
  });
});

