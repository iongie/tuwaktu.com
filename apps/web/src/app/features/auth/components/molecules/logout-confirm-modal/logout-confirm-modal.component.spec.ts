import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { LogoutConfirmModalComponent } from './logout-confirm-modal.component';

describe('LogoutConfirmModalComponent', () => {
  let component: LogoutConfirmModalComponent;
  let componentRef: ComponentRef<LogoutConfirmModalComponent>;
  let fixture: ComponentFixture<LogoutConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutConfirmModalComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('isOpen', false);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen modal konfirmasi keluar', () => {
    expect(component).toBeTruthy();
  });

  it('tidak boleh menampilkan dialog saat isOpen bernilai false', () => {
    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog).toBeNull();
  });

  it('harus menampilkan modal saat isOpen bernilai true', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Konfirmasi Keluar Akun');
  });

  it('harus memancarkan event confirmed saat tombol Ya, Keluar diklik', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let confirmedEmitted = false;
    component.confirmed.subscribe(() => {
      confirmedEmitted = true;
    });

    const confirmBtn = fixture.nativeElement.querySelector('#confirmLogoutBtn');
    confirmBtn.click();

    expect(confirmedEmitted).toBe(true);
  });

  it('harus memancarkan event cancelled saat tombol Batal diklik', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let cancelledEmitted = false;
    component.cancelled.subscribe(() => {
      cancelledEmitted = true;
    });

    const cancelBtn = fixture.nativeElement.querySelector('#cancelLogoutBtn');
    cancelBtn.click();

    expect(cancelledEmitted).toBe(true);
  });

  it('harus memancarkan event cancelled saat backdrop diklik', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let cancelledEmitted = false;
    component.cancelled.subscribe(() => {
      cancelledEmitted = true;
    });

    const backdrop = fixture.nativeElement.querySelector('#logoutBackdropBtn');
    backdrop.click();

    expect(cancelledEmitted).toBe(true);
  });
});
