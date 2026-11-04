import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthSpecialtyPickerComponent } from './auth-specialty-picker.component';
import { INITIAL_SPECIALTY_OPTIONS, SpecialtyOption } from '../../../models/auth.models';

describe('AuthSpecialtyPickerComponent', () => {
  let component: AuthSpecialtyPickerComponent;
  let fixture: ComponentFixture<AuthSpecialtyPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthSpecialtyPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthSpecialtyPickerComponent);
    component = fixture.componentInstance;
  });

  it('harus merender seluruh opsi keahlian spesialisasi', () => {
    fixture.componentRef.setInput('options', INITIAL_SPECIALTY_OPTIONS);
    fixture.componentRef.setInput('selectedId', 'cleaning');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(INITIAL_SPECIALTY_OPTIONS.length);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('harus memancarkan event selectSpecialty saat tombol ditekan', () => {
    fixture.componentRef.setInput('options', INITIAL_SPECIALTY_OPTIONS);
    fixture.componentRef.setInput('selectedId', 'cleaning');
    fixture.detectChanges();

    let emitted: SpecialtyOption | undefined;
    component.selectSpecialty.subscribe((val) => {
      emitted = val;
    });

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();

    expect(emitted).toBeDefined();
    expect(emitted?.id).toBe('ac-electric');
  });
});
