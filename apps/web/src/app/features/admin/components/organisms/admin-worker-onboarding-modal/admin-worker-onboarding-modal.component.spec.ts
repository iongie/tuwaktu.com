import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminWorkerOnboardingModalComponent } from './admin-worker-onboarding-modal.component';
import { AdminWorkerCreatedResponse } from '../../../models/admin-worker.model';

describe('AdminWorkerOnboardingModalComponent', () => {
  let component: AdminWorkerOnboardingModalComponent;
  let fixture: ComponentFixture<AdminWorkerOnboardingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkerOnboardingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkerOnboardingModalComponent);
    component = fixture.componentInstance;
  });

  it('harus memancarkan submitOnboarding saat form valid disubmit', () => {
    const submitSpy = jest.spyOn(component.submitOnboarding, 'emit');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.formData.name = 'Hendro Wijaya';
    component.formData.email = 'hendro@tuwaktu.com';
    component.formData.whatsapp_number = '6281311223344';

    component.handleSubmit();

    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Hendro Wijaya',
        email: 'hendro@tuwaktu.com',
        whatsapp_number: '6281311223344',
      })
    );
  });

  it('harus mengisi temporary_password saat generateRandomPassword dipanggil', () => {
    expect(component.formData.temporary_password).toBe('');
    component.generateRandomPassword();
    expect(component.formData.temporary_password.length).toBe(10);
  });

  it('harus menampilkan view sukses saat createdResult ada', () => {
    const mockCreated: AdminWorkerCreatedResponse = {
      account: {
        id: 'acc-1',
        email: 'hendro@tuwaktu.com',
        phone_number: '6281311223344',
        role: 'WORKER',
        account_status: 'ACTIVE',
        must_change_password: true,
      },
      worker: {
        id: 'wrk-1',
        slug: 'hendro-wijaya',
        name: 'Hendro Wijaya',
        zone: 'Jakarta Barat',
      },
      temporary_password: 'Password123!',
      invitation_text: 'Teks Undangan Hendro',
    };

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('createdResult', mockCreated);
    fixture.detectChanges();

    const successView = fixture.nativeElement.querySelector('[data-testid="success-onboarding-view"]');
    expect(successView).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Hendro Wijaya');
    expect(fixture.nativeElement.textContent).toContain('Password123!');

    expect(component.whatsappShareUrl()).toContain('wa.me/6281311223344');
  });

  it('harus menutup modal saat tombol Escape ditekan', () => {
    const closeSpy = jest.spyOn(component.closeClick, 'emit');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeSpy).toHaveBeenCalled();
  });
});

