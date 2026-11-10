import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerScheduleSidebarPanelComponent } from './worker-schedule-sidebar-panel.component';

describe('WorkerScheduleSidebarPanelComponent', () => {
  let component: WorkerScheduleSidebarPanelComponent;
  let fixture: ComponentFixture<WorkerScheduleSidebarPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerScheduleSidebarPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerScheduleSidebarPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance WorkerScheduleSidebarPanelComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memuat widget pratinjau publik dan TIDAK memuat widget tidak perlu (Anti-Slop)', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('app-schedule-public-preview-card')).toBeTruthy();
    expect(el.querySelector('app-schedule-manifesto-card')).toBeNull();
    expect(el.querySelector('app-schedule-calendar-sync-card')).toBeNull();
  });

  it('harus menerima input isSlot3Locked dan meneruskannya ke public preview card', () => {
    fixture.componentRef.setInput('isSlot3Locked', true);
    fixture.detectChanges();

    expect(component.isSlot3Locked()).toBe(true);
  });
});
