import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BusinessInquiryApiService } from './business-inquiry-api.service';
import {
  BUSINESS_PLAN_OPTIONS,
  BUSINESS_SERVICE_FOCUS_OPTIONS,
  BusinessPlanOption,
  BusinessPlanTier,
  BusinessPropertyType,
  BusinessVisitFrequency,
  calculateBusinessMonthlyEstimate,
  CreatedBusinessInquiryReceipt,
} from '../models/business-inquiry.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessInquiryStore {
  private readonly apiService = inject(BusinessInquiryApiService);

  readonly businessName = signal<string>('');
  readonly propertyType = signal<BusinessPropertyType>('KOS');
  readonly contactName = signal<string>('');
  readonly contactWhatsApp = signal<string>('');
  readonly contactEmail = signal<string>('');
  readonly cityZone = signal<string>('');
  readonly propertyAddress = signal<string>('');
  readonly selectedPlanTier = signal<BusinessPlanTier>('RUTIN_PROPERTI');
  readonly serviceFocus = signal<string>(BUSINESS_SERVICE_FOCUS_OPTIONS[0]);
  readonly unitCount = signal<number>(10);
  readonly visitFrequency = signal<BusinessVisitFrequency>('BULANAN');
  readonly preferredStartDate = signal<string>('');
  readonly notes = signal<string>('');
  readonly altchaPayload = signal<string | null>(null);
  readonly altchaResetTick = signal<number>(0);

  readonly validationErrors = signal<Record<string, string>>({});
  readonly isSubmitting = signal<boolean>(false);
  readonly submissionError = signal<string | null>(null);
  readonly createdReceipt = signal<CreatedBusinessInquiryReceipt | null>(null);

  readonly selectedPlanOption = computed<BusinessPlanOption>(() => {
    const tier = this.selectedPlanTier();
    return (
      BUSINESS_PLAN_OPTIONS.find((option) => option.tier === tier) ||
      BUSINESS_PLAN_OPTIONS[0]
    );
  });

  readonly estimatedMonthlyFee = computed<number>(() =>
    calculateBusinessMonthlyEstimate(
      this.selectedPlanTier(),
      this.unitCount(),
      this.visitFrequency(),
    ),
  );

  readonly hasValidationErrors = computed<boolean>(
    () => Object.keys(this.validationErrors()).length > 0,
  );

  selectPlanTier(tier: BusinessPlanTier): void {
    this.selectedPlanTier.set(tier);
    if (tier === 'MULTI_LOKASI' && this.unitCount() < 26) {
      this.unitCount.set(30);
    }
  }

  adjustUnitCount(delta: number): void {
    const next = Math.max(1, Math.min(2000, this.unitCount() + delta));
    this.unitCount.set(next);
    this.clearFieldError('unit_count');
  }

  setUnitCount(rawValue: number | string): void {
    const parsed = typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      this.unitCount.set(1);
      return;
    }
    this.unitCount.set(Math.max(1, Math.min(2000, Math.floor(parsed))));
    this.clearFieldError('unit_count');
  }

  clearFieldError(field: string): void {
    const current = this.validationErrors();
    if (!current[field]) {
      return;
    }
    const next = { ...current };
    delete next[field];
    this.validationErrors.set(next);
  }

  validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (this.businessName().trim().length < 2) {
      errors['business_name'] =
        'Nama usaha atau properti wajib diisi minimal 2 karakter.';
    }
    if (this.contactName().trim().length < 2) {
      errors['contact_name'] =
        'Nama penanggung jawab (PIC) wajib diisi minimal 2 karakter.';
    }

    const cleanPhone = this.contactWhatsApp().replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      errors['contact_whatsapp'] =
        'Nomor WhatsApp aktif wajib terdiri dari 10 hingga 15 digit angka.';
    }

    const email = this.contactEmail().trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['contact_email'] = 'Format alamat email kontak tidak valid.';
    }

    if (this.cityZone().trim().length < 2) {
      errors['city_zone'] = 'Kota atau wilayah lokasi wajib diisi.';
    }
    if (this.propertyAddress().trim().length < 10) {
      errors['property_address'] =
        'Alamat lengkap properti wajib diisi minimal 10 karakter.';
    }
    if (this.serviceFocus().trim().length < 3) {
      errors['service_focus'] = 'Fokus layanan perawatan wajib dipilih atau diisi.';
    }
    if (this.unitCount() < 1 || this.unitCount() > 2000) {
      errors['unit_count'] = 'Jumlah unit atau ruangan harus antara 1 sampai 2000.';
    }
    if (!this.altchaPayload()) {
      errors['altcha_payload'] =
        'Verifikasi keamanan captcha wajib diselesaikan sebelum mengirim.';
    }

    this.validationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  submitInquiry(): void {
    this.submissionError.set(null);
    if (!this.validateForm()) {
      return;
    }

    const altcha = this.altchaPayload();
    if (!altcha) {
      return;
    }

    this.isSubmitting.set(true);

    this.apiService
      .submitBusinessInquiry({
        business_name: this.businessName().trim(),
        property_type: this.propertyType(),
        contact_name: this.contactName().trim(),
        contact_whatsapp: this.contactWhatsApp().trim(),
        contact_email: this.contactEmail().trim(),
        city_zone: this.cityZone().trim(),
        property_address: this.propertyAddress().trim(),
        plan_tier: this.selectedPlanTier(),
        service_focus: this.serviceFocus().trim(),
        unit_count: this.unitCount(),
        visit_frequency: this.visitFrequency(),
        preferred_start_date: this.preferredStartDate().trim(),
        notes: this.notes().trim(),
        altcha_payload: altcha,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          if (response.success && response.data) {
            this.createdReceipt.set(response.data);
          } else {
            this.submissionError.set(
              response.message || 'Gagal mengirim pengajuan paket klien bisnis.',
            );
          }
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          this.altchaResetTick.update((tick) => tick + 1);
          this.altchaPayload.set(null);
          this.submissionError.set(this.extractIndonesianErrorMessage(err));
        },
      });
  }

  resetForNewInquiry(): void {
    this.businessName.set('');
    this.contactName.set('');
    this.contactWhatsApp.set('');
    this.contactEmail.set('');
    this.cityZone.set('');
    this.propertyAddress.set('');
    this.preferredStartDate.set('');
    this.notes.set('');
    this.altchaPayload.set(null);
    this.altchaResetTick.update((tick) => tick + 1);
    this.validationErrors.set({});
    this.submissionError.set(null);
    this.createdReceipt.set(null);
  }

  private extractIndonesianErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const bodyMsg =
        typeof err.error === 'object' &&
        err.error !== null &&
        'message' in err.error &&
        typeof (err.error as { message: unknown }).message === 'string'
          ? (err.error as { message: string }).message
          : '';
      if (bodyMsg) {
        return bodyMsg;
      }
      if (err.status === 0) {
        return 'Koneksi ke server terputus. Periksa jaringan Anda lalu coba kirim ulang.';
      }
    }
    return 'Terjadi kendala saat mengirim pengajuan. Silakan periksa data Anda dan coba lagi.';
  }
}

