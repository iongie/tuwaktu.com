import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AltchaCaptchaFieldComponent } from '../../../../auth/components/molecules/altcha-captcha-field/altcha-captcha-field.component';
import {
  BUSINESS_PROPERTY_TYPES,
  BUSINESS_SERVICE_FOCUS_OPTIONS,
  BUSINESS_VISIT_FREQUENCIES,
  BusinessPropertyType,
  BusinessVisitFrequency,
  formatRupiahIdr,
} from '../../../models/business-inquiry.model';
import { BusinessInquiryStore } from '../../../services/business-inquiry.store';

@Component({
  selector: 'app-business-inquiry-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AltchaCaptchaFieldComponent],
  template: `
    <div class="bg-body-canvas rounded-xl p-5 sm:p-7 border border-hairline-subtle flex flex-col gap-6">
      <div class="flex flex-col gap-1 pb-4 border-b border-hairline-subtle">
        <h2 class="font-heading-h2 text-heading-h2 font-bold text-ink-on-light">
          Formulir Pengajuan Properti
        </h2>
        <p class="font-body-default text-body-default text-ink-secondary">
          Isi data usaha dan perkiraan jumlah unit agar Admin dapat menyiapkan jadwal survei dan rincian penawaran.
        </p>
      </div>

      @if (store.submissionError()) {
        <div
          class="flex items-start gap-2.5 p-3.5 rounded-lg bg-error-surface border border-error/30 text-error-dark text-sm"
          role="alert"
          data-testid="b2b-submission-error"
        >
          <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
          <span>{{ store.submissionError() }}</span>
        </div>
      }

      <form class="flex flex-col gap-5" (ngSubmit)="store.submitInquiry()" novalidate>
        <!-- Tipe Properti -->
        <div class="flex flex-col gap-2">
          <span class="font-body-strong text-body-strong text-ink-on-light">
            Jenis Properti <span class="text-error">*</span>
          </span>
          <div class="flex flex-wrap gap-2">
            @for (typeOption of propertyTypes; track typeOption.value) {
              <button
                type="button"
                (click)="selectPropertyType(typeOption.value)"
                [attr.aria-pressed]="store.propertyType() === typeOption.value"
                class="min-h-11 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
                [class.bg-hero-canvas]="store.propertyType() === typeOption.value"
                [class.text-white]="store.propertyType() === typeOption.value"
                [class.border-hero-canvas]="store.propertyType() === typeOption.value"
                [class.bg-surface-highlight]="store.propertyType() !== typeOption.value"
                [class.text-ink-on-light]="store.propertyType() !== typeOption.value"
                [class.border-hairline-light]="store.propertyType() !== typeOption.value"
              >
                {{ typeOption.label }}
              </button>
            }
          </div>
        </div>

        <!-- Nama Usaha & Wilayah (2 kolom di tablet/desktop) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="b2bBusinessName" class="font-body-strong text-body-strong text-ink-on-light">
              Nama Usaha / Properti <span class="text-error">*</span>
            </label>
            <input
              id="b2bBusinessName"
              name="businessName"
              type="text"
              [ngModel]="store.businessName()"
              (ngModelChange)="onFieldChange('business_name', $event)"
              placeholder="Contoh: Kos Melati Kemang / Kantor PT Maju"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none"
            />
            @if (store.validationErrors()['business_name']) {
              <span class="text-xs text-error">{{ store.validationErrors()['business_name'] }}</span>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="b2bCityZone" class="font-body-strong text-body-strong text-ink-on-light">
              Kota / Kecamatan <span class="text-error">*</span>
            </label>
            <input
              id="b2bCityZone"
              name="cityZone"
              type="text"
              [ngModel]="store.cityZone()"
              (ngModelChange)="onFieldChange('city_zone', $event)"
              placeholder="Contoh: Jakarta Selatan, Depok, Bintaro"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none"
            />
            @if (store.validationErrors()['city_zone']) {
              <span class="text-xs text-error">{{ store.validationErrors()['city_zone'] }}</span>
            }
          </div>
        </div>

        <!-- Alamat Lengkap -->
        <div class="flex flex-col gap-1.5">
          <label for="b2bPropertyAddress" class="font-body-strong text-body-strong text-ink-on-light">
            Alamat Lengkap Lokasi <span class="text-error">*</span>
          </label>
          <textarea
            id="b2bPropertyAddress"
            name="propertyAddress"
            rows="2"
            [ngModel]="store.propertyAddress()"
            (ngModelChange)="onFieldChange('property_address', $event)"
            placeholder="Tuliskan nama jalan, nomor bangunan, dan patokan lokasi..."
            class="w-full px-3.5 py-2.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none resize-y min-h-20"
          ></textarea>
          @if (store.validationErrors()['property_address']) {
            <span class="text-xs text-error">{{ store.validationErrors()['property_address'] }}</span>
          }
        </div>

        <!-- Nama PIC & WhatsApp -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="b2bContactName" class="font-body-strong text-body-strong text-ink-on-light">
              Nama Penanggung Jawab (PIC) <span class="text-error">*</span>
            </label>
            <input
              id="b2bContactName"
              name="contactName"
              type="text"
              [ngModel]="store.contactName()"
              (ngModelChange)="onFieldChange('contact_name', $event)"
              placeholder="Contoh: Ibu Ratna / Bapak Hendra"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none"
            />
            @if (store.validationErrors()['contact_name']) {
              <span class="text-xs text-error">{{ store.validationErrors()['contact_name'] }}</span>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="b2bContactWhatsapp" class="font-body-strong text-body-strong text-ink-on-light">
              Nomor WhatsApp PIC <span class="text-error">*</span>
            </label>
            <input
              id="b2bContactWhatsapp"
              name="contactWhatsApp"
              type="tel"
              inputmode="numeric"
              [ngModel]="store.contactWhatsApp()"
              (ngModelChange)="onFieldChange('contact_whatsapp', $event)"
              placeholder="Contoh: 081288992211"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none"
            />
            @if (store.validationErrors()['contact_whatsapp']) {
              <span class="text-xs text-error">{{ store.validationErrors()['contact_whatsapp'] }}</span>
            }
          </div>
        </div>

        <!-- Email & Fokus Layanan -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="b2bContactEmail" class="font-body-strong text-body-strong text-ink-on-light">
              Email Invoice (Opsional)
            </label>
            <input
              id="b2bContactEmail"
              name="contactEmail"
              type="email"
              [ngModel]="store.contactEmail()"
              (ngModelChange)="onFieldChange('contact_email', $event)"
              placeholder="nama@perusahaan.co.id"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none"
            />
            @if (store.validationErrors()['contact_email']) {
              <span class="text-xs text-error">{{ store.validationErrors()['contact_email'] }}</span>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="b2bServiceFocus" class="font-body-strong text-body-strong text-ink-on-light">
              Fokus Perawatan Utama <span class="text-error">*</span>
            </label>
            <select
              id="b2bServiceFocus"
              name="serviceFocus"
              [ngModel]="store.serviceFocus()"
              (ngModelChange)="onFieldChange('service_focus', $event)"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none cursor-pointer"
            >
              @for (focusOption of serviceFocusOptions; track focusOption) {
                <option [value]="focusOption">{{ focusOption }}</option>
              }
            </select>
            @if (store.validationErrors()['service_focus']) {
              <span class="text-xs text-error">{{ store.validationErrors()['service_focus'] }}</span>
            }
          </div>
        </div>

        <!-- Jumlah Unit & Tanggal Mulai -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="b2bUnitCount" class="font-body-strong text-body-strong text-ink-on-light">
              Perkiraan Jumlah Unit AC / Ruangan <span class="text-error">*</span>
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="store.adjustUnitCount(-1)"
                aria-label="Kurangi jumlah unit"
                class="min-h-12 min-w-12 rounded-lg bg-surface-highlight hover:bg-surface-container border border-hairline-light font-mono-rate font-bold text-ink-on-light cursor-pointer"
              >
                -
              </button>
              <input
                id="b2bUnitCount"
                name="unitCount"
                type="number"
                min="1"
                max="2000"
                [ngModel]="store.unitCount()"
                (ngModelChange)="store.setUnitCount($event)"
                class="w-full min-h-12 px-3 text-center rounded-lg bg-surface-highlight border border-hairline-light font-mono-rate font-bold text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none"
              />
              <button
                type="button"
                (click)="store.adjustUnitCount(1)"
                aria-label="Tambah jumlah unit"
                class="min-h-12 min-w-12 rounded-lg bg-surface-highlight hover:bg-surface-container border border-hairline-light font-mono-rate font-bold text-ink-on-light cursor-pointer"
              >
                +
              </button>
            </div>
            @if (store.validationErrors()['unit_count']) {
              <span class="text-xs text-error">{{ store.validationErrors()['unit_count'] }}</span>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="b2bStartDate" class="font-body-strong text-body-strong text-ink-on-light">
              Target Mulai Survei / Kerja (Opsional)
            </label>
            <input
              id="b2bStartDate"
              name="preferredStartDate"
              type="date"
              [ngModel]="store.preferredStartDate()"
              (ngModelChange)="store.preferredStartDate.set($event)"
              class="w-full min-h-12 px-3.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm font-mono-rate text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none"
            />
          </div>
        </div>

        <!-- Frekuensi Kunjungan -->
        <div class="flex flex-col gap-2">
          <span class="font-body-strong text-body-strong text-ink-on-light">
            Jadwal Kunjungan Rutin <span class="text-error">*</span>
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            @for (freqOption of visitFrequencies; track freqOption.value) {
              <button
                type="button"
                (click)="selectFrequency(freqOption.value)"
                [attr.aria-pressed]="store.visitFrequency() === freqOption.value"
                class="min-h-12 px-3.5 py-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                [class.bg-surface-warm-promo]="store.visitFrequency() === freqOption.value"
                [class.border-voltage-orange]="store.visitFrequency() === freqOption.value"
                [class.bg-surface-highlight]="store.visitFrequency() !== freqOption.value"
                [class.border-hairline-light]="store.visitFrequency() !== freqOption.value"
              >
                <span class="text-xs font-bold text-ink-on-light">{{ freqOption.label }}</span>
                @if (freqOption.hint) {
                  <span class="text-[11px] font-mono-rate text-ink-secondary">{{ freqOption.hint }}</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Catatan Tambahan -->
        <div class="flex flex-col gap-1.5">
          <label for="b2bNotes" class="font-body-strong text-body-strong text-ink-on-light">
            Catatan Khusus Lapangan (Opsional)
          </label>
          <textarea
            id="b2bNotes"
            name="notes"
            rows="2"
            [ngModel]="store.notes()"
            (ngModelChange)="store.notes.set($event)"
            placeholder="Contoh: Jam akses gedung hanya Senin - Jumat pukul 09.00 - 16.00 WIB."
            class="w-full px-3.5 py-2.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light placeholder:text-ink-disabled focus:bg-body-canvas focus:border-accent-link focus:outline-none resize-y min-h-20"
          ></textarea>
        </div>

        <!-- Panel Estimasi Biaya Pengelolaan Bulanan -->
        <div class="p-4 rounded-xl bg-surface-warm-promo border border-promo-ink/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-promo-ink uppercase tracking-wider font-mono-rate">
              Estimasi Awal Pengelolaan Bulanan
            </span>
            <span class="text-xs text-ink-secondary">
              Acuan biaya koordinasi &amp; catatan layanan sebelum survei lokasi oleh Admin (di luar ongkos pengerjaan teknisi jika ada perbaikan berat).
            </span>
          </div>
          <span
            class="font-mono-rate text-xl font-bold text-ink-on-light shrink-0 tabular-nums"
            data-testid="estimated-monthly-fee"
          >
            {{ formatRupiah(store.estimatedMonthlyFee()) }}
          </span>
        </div>

        <!-- Verifikasi Captcha Altcha -->
        <div class="flex flex-col gap-1.5">
          <app-altcha-captcha-field
            [disabled]="store.isSubmitting()"
            [resetTick]="store.altchaResetTick()"
            (verifiedPayload)="onAltchaVerified($event)"
          />
          @if (store.validationErrors()['altcha_payload']) {
            <span class="text-xs text-error">{{ store.validationErrors()['altcha_payload'] }}</span>
          }
        </div>

        <!-- Tombol Submit -->
        <button
          type="submit"
          [disabled]="store.isSubmitting()"
          data-testid="submit-b2b-inquiry-btn"
          class="w-full min-h-12 px-6 py-3 rounded-lg bg-voltage-orange hover:bg-secondary text-white font-button-label text-button-label font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          @if (store.isSubmitting()) {
            <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Menyimpan Pengajuan...</span>
          } @else {
            <span class="material-symbols-outlined text-[20px]">send</span>
            <span>Kirim Pengajuan &amp; Jadwalkan Survei</span>
          }
        </button>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessInquiryFormComponent {
  readonly store = inject(BusinessInquiryStore);

  readonly propertyTypes = BUSINESS_PROPERTY_TYPES;
  readonly visitFrequencies = BUSINESS_VISIT_FREQUENCIES;
  readonly serviceFocusOptions = BUSINESS_SERVICE_FOCUS_OPTIONS;

  selectPropertyType(value: BusinessPropertyType): void {
    this.store.propertyType.set(value);
  }

  selectFrequency(value: BusinessVisitFrequency): void {
    this.store.visitFrequency.set(value);
  }

  onFieldChange(field: string, value: string): void {
    switch (field) {
      case 'business_name':
        this.store.businessName.set(value);
        break;
      case 'city_zone':
        this.store.cityZone.set(value);
        break;
      case 'property_address':
        this.store.propertyAddress.set(value);
        break;
      case 'contact_name':
        this.store.contactName.set(value);
        break;
      case 'contact_whatsapp':
        this.store.contactWhatsApp.set(value);
        break;
      case 'contact_email':
        this.store.contactEmail.set(value);
        break;
      case 'service_focus':
        this.store.serviceFocus.set(value);
        break;
    }
    this.store.clearFieldError(field);
  }

  onAltchaVerified(payload: string): void {
    this.store.altchaPayload.set(payload);
    this.store.clearFieldError('altcha_payload');
  }

  formatRupiah(amount: number): string {
    return formatRupiahIdr(amount);
  }
}

