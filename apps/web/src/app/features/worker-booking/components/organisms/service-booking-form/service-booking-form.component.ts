import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicServiceCatalogItem } from '../../../models/worker-catalog.model';
import { FeeCalculationResult } from '../../../models/service-booking.model';
import { LocationMapPickerComponent } from '../../molecules/location-map-picker/location-map-picker.component';

export interface BookingFormDraft {
  clientFullName: string;
  clientContactPhone: string;
  clientEmailAddress: string;
  serviceLocationAddress: string;
  serviceOperationalZone: string;
  reservationScheduledDate: string;
  additionalClientNotes: string;
}

@Component({
  selector: 'app-service-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationMapPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="m3-card-surface p-6 space-y-6 sticky top-24">
      <div>
        <h3 class="text-xl font-serif font-bold text-[#141413]">
          Konfirmasi Jadwal Reservasi
        </h3>
        <p class="text-xs text-[#4E4642] mt-1">
          Lengkapi detail lokasi dan waktu kunjungan teknisi.
        </p>
      </div>

      @if (selectedService(); as selectedSvc) {
        <div class="p-4 bg-[#FDFCFB] rounded-xl border border-[#D2C4BE] text-xs font-mono space-y-1">
          <div class="text-[#4E4642] uppercase text-[11px]">Layanan Terpilih:</div>
          <div class="font-bold text-sm text-[#141413]">{{ selectedSvc.name }}</div>
          <div class="text-[#C84B31] font-bold text-sm">
            {{ formattedServicePrice() }}
          </div>
        </div>
      } @else {
        <div class="p-4 bg-[#FFDAD3]/40 border border-[#C84B31]/40 rounded-xl text-xs text-[#3F0300] font-mono">
          Silakan pilih salah satu layanan di daftar sebelah kiri terlebih dahulu.
        </div>
      }

      @if (serverErrorMessage()) {
        <div
          role="alert"
          class="p-3.5 bg-[#FFDAD6] border border-[#BA1A1A] rounded-xl text-xs text-[#410002] font-mono"
        >
          {{ serverErrorMessage() }}
        </div>
      }

      @if (feeCalculationError(); as calcError) {
        <div
          role="alert"
          class="p-3.5 border rounded-xl text-xs font-mono space-y-1"
          [class.bg-[#FFDAD6]]="isOutOfRadius()"
          [class.border-[#BA1A1A]]="isOutOfRadius()"
          [class.text-[#410002]]="isOutOfRadius()"
          [class.bg-[#FFDAD3]/50]="!isOutOfRadius()"
          [class.border-[#C84B31]/50]="!isOutOfRadius()"
          [class.text-[#3F0300]]="!isOutOfRadius()"
        >
          <div class="font-bold uppercase tracking-wider" [class.text-[#BA1A1A]]="isOutOfRadius()">
            @if (isOutOfRadius()) {
              Di Luar Jangkauan Layanan
            } @else {
              Informasi Ongkos Jalan
            }
          </div>
          <div>
            {{ calcError }}
          </div>
        </div>
      }

      <form (ngSubmit)="submitForm.emit()" class="space-y-4" novalidate>
        @if (validationErrors()['service']) {
          <p role="alert" class="text-xs text-[#BA1A1A] font-mono">
            {{ validationErrors()['service'] }}
          </p>
        }

        <div>
          <label for="clientNameInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
            Nama Lengkap Klien <span class="text-[#BA1A1A]">*</span>
          </label>
          <input
            id="clientNameInput"
            type="text"
            name="clientFullName"
            [ngModel]="formDraft().clientFullName"
            (ngModelChange)="updateDraftField('clientFullName', $event); clearFieldError.emit('client_name')"
            required
            placeholder="Masukkan nama lengkap Anda"
            class="m3-field-outlined"
            [class.m3-field-error]="validationErrors()['client_name']"
          />
          @if (validationErrors()['client_name']) {
            <p class="mt-1.5 text-xs text-[#BA1A1A] font-mono">
              {{ validationErrors()['client_name'] }}
            </p>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label for="clientPhoneInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
              Nomor Telepon / WhatsApp
            </label>
            <input
              id="clientPhoneInput"
              type="tel"
              name="clientContactPhone"
              [ngModel]="formDraft().clientContactPhone"
              (ngModelChange)="updateDraftField('clientContactPhone', $event)"
              placeholder="08xxxxxxxxxx"
              class="m3-field-outlined"
            />
          </div>
          <div>
            <label for="clientEmailInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
              Alamat Email
            </label>
            <input
              id="clientEmailInput"
              type="email"
              name="clientEmailAddress"
              [ngModel]="formDraft().clientEmailAddress"
              (ngModelChange)="updateDraftField('clientEmailAddress', $event)"
              placeholder="nama@domain.com"
              class="m3-field-outlined"
            />
          </div>
        </div>

        <div>
          <label for="serviceLocationInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
            Alamat Lengkap Lokasi Servis <span class="text-[#BA1A1A]">*</span>
          </label>
          <textarea
            id="serviceLocationInput"
            name="serviceLocationAddress"
            [ngModel]="formDraft().serviceLocationAddress"
            (ngModelChange)="updateDraftField('serviceLocationAddress', $event); clearFieldError.emit('location')"
            required
            rows="2"
            placeholder="Nama jalan, nomor rumah, RT/RW, atau patokan lokasi"
            class="m3-field-outlined"
            [class.m3-field-error]="validationErrors()['location']"
          ></textarea>
          @if (validationErrors()['location']) {
            <p class="mt-1.5 text-xs text-[#BA1A1A] font-mono">
              {{ validationErrors()['location'] }}
            </p>
          }
        </div>

        <!-- Pemilih Titik Koordinat Peta -->
        <div class="pt-1">
          <app-location-map-picker
            [latitude]="clientCoordinates()?.lat ?? null"
            [longitude]="clientCoordinates()?.lng ?? null"
            label="Titik Koordinat Lokasi Servis"
            helperText="Pilih titik peta atau gunakan lokasi GPS agar sistem menghitung ongkos jalan secara otomatis."
            (coordinatesChange)="clientCoordinatesChange.emit($event)"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label for="serviceZoneInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
              Zona Operasional
            </label>
            <input
              id="serviceZoneInput"
              type="text"
              name="serviceOperationalZone"
              [ngModel]="formDraft().serviceOperationalZone"
              (ngModelChange)="updateDraftField('serviceOperationalZone', $event); clearFieldError.emit('location')"
              placeholder="Misal: Jakarta Selatan"
              class="m3-field-outlined"
            />
          </div>
          <div>
            <label for="scheduledDateInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
              Waktu Kedatangan
            </label>
            <input
              id="scheduledDateInput"
              type="datetime-local"
              name="reservationScheduledDate"
              [ngModel]="formDraft().reservationScheduledDate"
              (ngModelChange)="updateDraftField('reservationScheduledDate', $event); clearFieldError.emit('booking_date')"
              class="m3-field-outlined"
              [class.m3-field-error]="validationErrors()['booking_date']"
            />
            @if (validationErrors()['booking_date']) {
              <p class="mt-1.5 text-xs text-[#BA1A1A] font-mono">
                {{ validationErrors()['booking_date'] }}
              </p>
            }
          </div>
        </div>

        <div>
          <label for="clientNotesInput" class="block text-xs font-mono font-medium text-[#4E4642] mb-1.5">
            Catatan Tambahan untuk Teknisi
          </label>
          <textarea
            id="clientNotesInput"
            name="additionalClientNotes"
            [ngModel]="formDraft().additionalClientNotes"
            (ngModelChange)="updateDraftField('additionalClientNotes', $event)"
            rows="2"
            placeholder="Keluhan unit, lantai lokasi, atau instruksi khusus"
            class="m3-field-outlined"
          ></textarea>
        </div>

        <!-- Pricing Breakdown & Ongkos Jalan -->
        <div class="pt-3 border-t border-[#D2C4BE] space-y-2.5">
          <div class="text-xs font-mono font-bold text-[#141413] pb-1 border-b border-[#D2C4BE]/50 uppercase tracking-wider">
            Rincian Pembayaran
          </div>

          <div class="flex items-center justify-between text-xs font-mono text-[#4E4642]">
            <span>Tarif Layanan Dasar:</span>
            <span class="font-semibold text-[#141413]">{{ formattedServicePrice() }}</span>
          </div>

          @if (isCalculatingFee()) {
            <div class="flex items-center justify-between text-xs font-mono text-[#4E4642] animate-pulse">
              <span>Menghitung Ongkos Jalan...</span>
              <span class="inline-block w-3.5 h-3.5 border-2 border-[#C84B31] border-t-transparent rounded-full animate-spin"></span>
            </div>
          } @else if (feeCalculation(); as fee) {
            <div class="flex items-center justify-between text-xs font-mono text-[#4E4642]">
              <span>Jarak Tempuh Garis Lurus:</span>
              <span class="font-semibold text-[#141413]">{{ fee.distance_km }} km</span>
            </div>

            <div class="flex items-center justify-between text-xs font-mono text-[#4E4642]">
              <span>Batas Bebas Ongkos Jalan:</span>
              <span class="text-[#1E4D3B] font-semibold">{{ fee.free_radius_km }} km</span>
            </div>

            <div class="flex items-center justify-between text-xs font-mono text-[#4E4642]">
              <span>Biaya Ongkos Jalan:</span>
              @if (fee.transport_fee > 0) {
                <span class="font-bold text-[#C84B31]">+ {{ formatRupiah(fee.transport_fee) }}</span>
              } @else {
                <span class="font-bold text-[#1E4D3B]">Bebas Biaya (Rp 0)</span>
              }
            </div>
          }

          <div class="pt-2 border-t border-[#D2C4BE] flex items-center justify-between text-xs font-mono">
            <span class="text-[#4E4642] font-semibold">Total Estimasi Biaya:</span>
            <span class="text-base font-bold text-[#141413]">
              {{ formattedTotalEstimate() }}
            </span>
          </div>

          <button
            type="submit"
            [disabled]="isSubmitting() || !hasActiveProfile() || isOutOfRadius() || isCalculatingFee()"
            class="m3-btn-filled w-full font-mono uppercase tracking-wider"
          >
            @if (isSubmitting()) {
              <span>Memproses Reservasi...</span>
            } @else if (isOutOfRadius()) {
              <span>Di Luar Jangkauan Layanan</span>
            } @else {
              <span>Kunci Jadwal &amp; Buat Kode Booking</span>
            }
          </button>
        </div>
      </form>
    </aside>
  `,
})
export class ServiceBookingFormComponent {
  readonly selectedService = input<PublicServiceCatalogItem | null>(null);
  readonly formattedServicePrice = input<string>('Rp 0');
  readonly formattedTotalEstimate = input<string>('Rp 0');
  readonly serverErrorMessage = input<string | null>(null);
  readonly validationErrors = input<Record<string, string>>({});
  readonly isSubmitting = input<boolean>(false);
  readonly hasActiveProfile = input<boolean>(false);
  readonly formDraft = input.required<BookingFormDraft>();
  readonly clientCoordinates = input<{ lat: number; lng: number } | null>(null);
  readonly feeCalculation = input<FeeCalculationResult | null>(null);
  readonly isCalculatingFee = input<boolean>(false);
  readonly feeCalculationError = input<string | null>(null);
  readonly isOutOfRadius = input<boolean>(false);

  readonly formDraftChange = output<BookingFormDraft>();
  readonly clientCoordinatesChange = output<{ lat: number; lng: number }>();
  readonly clearFieldError = output<string>();
  readonly submitForm = output<void>();

  updateDraftField<K extends keyof BookingFormDraft>(field: K, value: BookingFormDraft[K]): void {
    this.formDraftChange.emit({
      ...this.formDraft(),
      [field]: value,
    });
  }

  formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}


