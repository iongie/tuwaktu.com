import { Injectable, signal } from '@angular/core';
import {
  INITIAL_SPECIALTY_OPTIONS,
  LoginFormData,
  MagicLinkStatus,
  OtpDispatchStatus,
  RegisterFormData,
  SlugValidationState,
  SpecialtyOption,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly specialtyOptions: readonly SpecialtyOption[] = INITIAL_SPECIALTY_OPTIONS;

  readonly selectedSpecialty = signal<SpecialtyOption>(INITIAL_SPECIALTY_OPTIONS[0]);
  readonly otpStatus = signal<OtpDispatchStatus>('idle');
  readonly otpFeedbackMessage = signal<string>('');
  readonly magicLinkStatus = signal<MagicLinkStatus>('idle');
  readonly magicLinkFeedbackMessage = signal<string>('');

  selectSpecialty(specialty: SpecialtyOption): void {
    this.selectedSpecialty.set(specialty);
  }

  selectSpecialtyById(specialtyId: string): void {
    const found = this.specialtyOptions.find((opt) => opt.id === specialtyId);
    if (found) {
      this.selectedSpecialty.set(found);
    }
  }

  validateSlug(slug: string): SlugValidationState {
    const clean = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!clean) {
      return {
        isValid: false,
        message: 'Wajib diisi (min. 3 karakter)',
      };
    }
    if (clean.length < 3) {
      return {
        isValid: false,
        message: 'Minimal 3 karakter alfanumerik',
      };
    }
    return {
      isValid: true,
      message: 'Tersedia & Siap Diklaim',
    };
  }

  sanitizeSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async sendInstantOtp(waNumber: string, delayMs = 700): Promise<boolean> {
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 8) {
      this.otpStatus.set('error');
      this.otpFeedbackMessage.set('Nomor WhatsApp tidak valid (minimal 8 digit).');
      return false;
    }

    this.otpStatus.set('sending');
    this.otpFeedbackMessage.set('Mengirim...');

    if (delayMs <= 0) {
      this.otpStatus.set('sent');
      this.otpFeedbackMessage.set(
        'Kode OTP 6-Digit dikirim langsung ke WhatsApp Anda tanpa jeda.'
      );
      return true;
    }

    // Simulasi respons instan direct handshake
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        this.otpStatus.set('sent');
        this.otpFeedbackMessage.set(
          'Kode OTP 6-Digit dikirim langsung ke WhatsApp Anda tanpa jeda.'
        );
        resolve(true);
      }, delayMs);
    });
  }

  async sendMagicLink(waNumber: string, delayMs = 700): Promise<boolean> {
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 8) {
      this.magicLinkStatus.set('error');
      this.magicLinkFeedbackMessage.set('Nomor WhatsApp wajib diisi dengan benar.');
      return false;
    }

    this.magicLinkStatus.set('sending');
    this.magicLinkFeedbackMessage.set('Mengirim Tautan Otentikasi...');

    if (delayMs <= 0) {
      this.magicLinkStatus.set('sent');
      this.magicLinkFeedbackMessage.set('Tautan Terkirim ke WhatsApp Anda!');
      return true;
    }

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        this.magicLinkStatus.set('sent');
        this.magicLinkFeedbackMessage.set('Tautan Terkirim ke WhatsApp Anda!');
        resolve(true);
      }, delayMs);
    });
  }

  validateRegistration(data: RegisterFormData): { isValid: boolean; error?: string } {
    if (!data.fullName.trim()) {
      return { isValid: false, error: 'Nama lengkap pekerja atau entitas usaha wajib diisi.' };
    }
    if (!data.waNumber.trim() || data.waNumber.replace(/[^0-9]/g, '').length < 8) {
      return { isValid: false, error: 'Nomor WhatsApp bisnis tidak valid (minimal 8 digit).' };
    }
    if (!data.basecamp.trim()) {
      return { isValid: false, error: 'Basecamp operasional dan titik radius nol wajib diisi.' };
    }
    const slugCheck = this.validateSlug(data.customSlug);
    if (!slugCheck.isValid) {
      return { isValid: false, error: slugCheck.message };
    }
    if (!/^\d{6}$/.test(data.pin)) {
      return { isValid: false, error: 'PIN Kedaulatan harus berupa 6 digit angka.' };
    }
    if (data.pin !== data.pinConfirm) {
      return { isValid: false, error: 'Konfirmasi PIN tidak cocok dengan PIN Akses.' };
    }
    if (!data.doctrineAccepted) {
      return {
        isValid: false,
        error: 'Harap setujui Pakta Kedaulatan Pekerja Tuwaktu untuk melanjutkan.',
      };
    }

    return { isValid: true };
  }

  validateLogin(data: LoginFormData): { isValid: boolean; error?: string } {
    if (data.method === 'wa') {
      const clean = data.waNumber.replace(/[^0-9]/g, '');
      if (clean.length < 8) {
        return { isValid: false, error: 'Nomor WhatsApp terdaftar wajib diisi minimal 8 digit.' };
      }
    } else {
      if (!data.workerId.trim()) {
        return { isValid: false, error: 'Email atau ID Praktisi wajib diisi.' };
      }
    }

    if (!/^\d{6}$/.test(data.pin)) {
      return { isValid: false, error: 'PIN Kedaulatan harus terdiri dari 6 digit angka.' };
    }

    return { isValid: true };
  }
}
