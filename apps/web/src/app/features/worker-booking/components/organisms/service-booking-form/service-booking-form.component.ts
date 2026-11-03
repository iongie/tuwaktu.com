import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicServiceCatalogItem } from '../../../models/worker-catalog.model';
import { AvailableTimeSlot, FeeCalculationResult } from '../../../models/service-booking.model';
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
    <form (ngSubmit)="submitForm.emit()" class="w-full" novalidate>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- ======================= LEFT STREAM: 4 SECTIONS CONFIGURATION (8 COLS) ======================= -->
        <div class="lg:col-span-8 space-y-8">
          <!-- SECTION 01 / LAYANAN & DURASI -->
          <section class="space-y-4 bg-white p-6 rounded-xl border border-(--hairline-light) shadow-xs">
            <div class="flex items-baseline justify-between border-b border-(--hairline-light) pb-3">
              <div>
                <span class="font-mono text-[10px] text-(--voltage-orange) tracking-widest uppercase font-bold block mb-1">
                  01 / LAYANAN &amp; DURASI
                </span>
                <h3 class="text-lg sm:text-xl font-bold text-(--brand-ink)">
                  Spesifikasi &amp; Durasi Layanan
                </h3>
              </div>
              <span class="text-xs text-(--brand-ink)/60 hidden sm:inline-block">
                Disesuaikan dengan volume kebutuhan Anda
              </span>
            </div>

            @if (selectedService(); as selectedSvc) {
              <div class="p-4 bg-(--surface-light) rounded-xl border border-(--hairline-light) space-y-3">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="inline-block px-2 py-0.5 rounded bg-(--voltage-orange) text-white font-mono text-[10px] uppercase font-bold">
                      PILIHAN TERPILIH
                    </span>
                    <div class="font-bold text-base text-(--brand-ink) mt-1">
                      {{ selectedSvc.name }}
                    </div>
                    <p class="text-xs text-(--brand-ink)/60 mt-0.5">
                      {{ selectedSvc.description }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-base font-mono-rate font-bold text-(--brand-ink)">
                      {{ formattedServicePrice() }}
                    </div>
                    <span class="text-[11px] font-mono text-(--brand-ink)/60">
                      {{ isHourlyService() ? 'Tarif / Jam' : 'Tarif / Sesi' }}
                    </span>
                  </div>
                </div>

                <!-- Interactive Duration Stepper for Hourly Services -->
                @if (isHourlyService()) {
                  <div class="pt-3 border-t border-(--hairline-light) flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-xs sm:text-sm text-(--brand-ink)">
                        Durasi Pengerjaan
                      </div>
                      <p class="text-[11px] text-(--brand-ink)/60">
                        Minimal pengerjaan 2.0 Jam untuk standardisasi mutu mandiri.
                      </p>
                    </div>

                    <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-(--hairline-light) shadow-xs self-start sm:self-auto">
                      <button
                        type="button"
                        (click)="stepDuration(-0.5)"
                        [disabled]="hourlyDuration() <= 2.0"
                        class="w-7 h-7 rounded bg-(--surface-light) hover:bg-gray-200 text-(--brand-ink) font-bold text-sm flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                        title="Kurangi 30 Menit"
                      >
                        -
                      </button>
                      <span class="font-mono-rate font-bold text-sm text-(--brand-ink) w-16 text-center">
                        {{ hourlyDuration() }} Jam
                      </span>
                      <button
                        type="button"
                        (click)="stepDuration(0.5)"
                        [disabled]="hourlyDuration() >= 8.0"
                        class="w-7 h-7 rounded bg-(--surface-light) hover:bg-gray-200 text-(--brand-ink) font-bold text-sm flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                        title="Tambah 30 Menit"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <!-- Live calculation formula -->
                  <div class="flex items-center gap-1.5 font-mono text-xs text-(--brand-ink)/60 pt-1">
                    <span>Kalkulasi Dasar: {{ hourlyDuration() }} jam × {{ formattedServicePrice() }} = <strong class="text-(--brand-ink)">{{ formattedBaseTotal() }}</strong></span>
                  </div>
                }
              </div>
            } @else {
              <div class="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono text-amber-900">
                Silakan pilih salah satu layanan spesialis pada katalog di sebelah kiri terlebih dahulu.
              </div>
            }

            @if (validationErrors()['service']) {
              <p role="alert" class="text-xs text-red-600 font-mono font-semibold">
                {{ validationErrors()['service'] }}
              </p>
            }
          </section>

          <!-- SECTION 02 / LOGISTIK MANDIRI & RADIUS -->
          <section class="space-y-4 bg-white p-6 rounded-xl border border-(--hairline-light) shadow-xs">
            <div class="flex items-baseline justify-between border-b border-(--hairline-light) pb-3">
              <div>
                <span class="font-mono text-[10px] text-(--voltage-orange) tracking-widest uppercase font-bold block mb-1">
                  02 / LOGISTIK MANDIRI
                </span>
                <h3 class="text-lg sm:text-xl font-bold text-(--brand-ink)">
                  Kalkulator Radius &amp; Ongkos Jalan Otomatis
                </h3>
              </div>
              <p class="text-xs text-(--brand-ink)/60 hidden sm:inline-block">
                Transparansi subsidi radius perjalanan pekerja dari pangkalan
              </p>
            </div>

            <!-- Location Picker Molecule -->
            <app-location-map-picker
              [latitude]="clientCoordinates()?.lat ?? null"
              [longitude]="clientCoordinates()?.lng ?? null"
              [radiusKm]="feeCalculation()?.max_radius_km ?? 10"
              label="Titik Antar / Lokasi Pemesan"
              helperText="Pilih titik koordinat pada peta atau gunakan GPS agar tarif ongkos jalan terhitung otomatis."
              (coordinatesChange)="onCoordinatesSelected($event)"
            />

            @if (feeCalculation(); as fee) {
              <!-- Distance indicator pill & Visual Step Meter Bar -->
              <div class="space-y-3 pt-2">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-xs font-bold text-(--brand-ink) uppercase tracking-wider">
                    JARAK TERKALKULASI: {{ fee.distance_km }} KM
                  </span>
                  <span class="text-xs font-mono font-bold" [class.text-emerald-700]="fee.is_within_radius" [class.text-red-600]="!fee.is_within_radius">
                    {{ fee.is_within_radius ? 'JANGKAUAN TERVERIFIKASI' : 'MELEBIHI RADIUS MAKSIMAL' }}
                  </span>
                </div>

                <!-- Visual Radius Step Meter Bar from Stitch -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-[11px] font-mono">
                    <span class="text-emerald-700 font-bold flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 0.0 - {{ fee.free_radius_km }} Km (Subsidi Bebas Ongkir)
                    </span>
                    <span class="text-amber-700 font-bold flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span> {{ fee.free_radius_km }} - {{ fee.max_radius_km }} Km (+Rp {{ fee.extra_fee_per_km }} / km)
                    </span>
                    <span class="text-red-700 font-bold flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-red-500"></span> &gt; {{ fee.max_radius_km }} Km (Di Luar Jangkauan)
                    </span>
                  </div>

                  <div class="w-full bg-gray-200 h-3.5 rounded-full overflow-hidden flex relative">
                    <div class="h-full bg-emerald-500" style="width: 50%" title="Gratis Ongkos Jalan"></div>
                    <div class="h-full bg-amber-400" style="width: 50%" title="Zona Tambahan Bensin"></div>
                    @if (markerPositionPercent(); as mPos) {
                      <div class="absolute top-0 bottom-0 w-2 bg-(--brand-ink) shadow-md" [style.left.%]="mPos" title="Posisi Lokasi Anda"></div>
                    }
                  </div>
                </div>

                <!-- Transport Breakdown Ledger Box -->
                <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
                  <span class="text-base leading-none">&#9888;</span>
                  <div class="space-y-1 leading-relaxed">
                    <strong class="font-bold block">Rincian Pembayaran &amp; Ongkos Transportasi Otomatis:</strong>
                    <span>
                      Jarak tempuh total <strong>{{ fee.distance_km }} km</strong>.
                      Batas gratis hingga <strong>{{ fee.free_radius_km }} km</strong> (3 km).
                      Kelebihan jarak: <strong>{{ getChargeableKm(fee) }} km</strong> × Rp {{ fee.extra_fee_per_km }}/km = 
                      <strong class="font-mono font-bold">{{ formatCurrency(fee.transport_fee) }}</strong> (15.000).
                    </span>
                  </div>
                </div>
              </div>
            }

            @if (feeCalculationError(); as calcError) {
              <div
                role="alert"
                class="p-4 border rounded-xl text-xs font-mono space-y-1"
                [class.bg-red-50]="isOutOfRadius()"
                [class.border-red-300]="isOutOfRadius()"
                [class.text-red-900]="isOutOfRadius()"
                [class.bg-amber-50]="!isOutOfRadius()"
                [class.border-amber-300]="!isOutOfRadius()"
                [class.text-amber-900]="!isOutOfRadius()"
              >
                <div class="font-bold uppercase tracking-wider">
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
          </section>

          <!-- SECTION 03 / JADWAL & BUFFER DISIPLIN -->
          <section class="space-y-4 bg-white p-6 rounded-xl border border-(--hairline-light) shadow-xs">
            <div class="flex items-baseline justify-between border-b border-(--hairline-light) pb-3">
              <div>
                <span class="font-mono text-[10px] text-(--voltage-orange) tracking-widest uppercase font-bold block mb-1">
                  03 / JADWAL &amp; BUFFER DISIPLIN
                </span>
                <h3 class="text-lg sm:text-xl font-bold text-(--brand-ink)">
                  Pilih Tanggal &amp; Slot Waktu Kedatangan
                </h3>
              </div>
              <p class="text-xs text-(--brand-ink)/60 hidden sm:inline-block">
                Sistem mengunci otomatis jeda buffer transit 60-90 menit
              </p>
            </div>

            <!-- Date Selector Input -->
            <div class="space-y-2">
              <label for="reservationDateInput" class="block text-xs font-bold font-mono uppercase tracking-wider text-(--brand-ink)">
                Tanggal Kedatangan Teknisi <span class="text-(--voltage-orange)">*</span>
              </label>
              <input
                id="reservationDateInput"
                type="date"
                [ngModel]="selectedBookingDate()"
                (ngModelChange)="onDatePickerChange($event)"
                name="reservationScheduledDate"
                class="m3-field-outlined font-mono w-full sm:w-64"
              />
            </div>

            <!-- Slot Time Matrix with LOCKED 90M Transit Protection Bands -->
            @if (isSlotsLoading()) {
              <div class="space-y-2 animate-pulse" aria-label="Memuat ketersediaan slot waktu">
                <div class="h-12 bg-gray-100 rounded-lg"></div>
                <div class="h-8 bg-gray-50 rounded-lg"></div>
                <div class="h-12 bg-gray-100 rounded-lg"></div>
              </div>
            } @else if (availableSlots().length > 0) {
              <div class="space-y-2 pt-1">
                <span class="text-xs font-mono text-(--brand-ink)/60 block mb-1">
                  Jadwal Ketersediaan Slot Kerja (Buffer Transit Terproteksi):
                </span>

                <div role="group" aria-label="Pilihan slot waktu kedatangan" class="space-y-2">
                  @for (slot of availableSlots(); track slot.slot_type; let idx = $index) {
                    <!-- Slot Button -->
                    <button
                      type="button"
                      [disabled]="!slot.available"
                      (click)="onSlotClick(slot)"
                      class="w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer min-h-[48px]"
                      [class.bg-(--brand-ink)]="isSlotActive(slot)"
                      [class.text-white]="isSlotActive(slot)"
                      [class.border-(--voltage-orange)]="isSlotActive(slot)"
                      [class.ring-2]="isSlotActive(slot)"
                      [class.ring-(--voltage-orange)]="isSlotActive(slot)"
                      [class.bg-white]="!isSlotActive(slot) && slot.available"
                      [class.text-(--brand-ink)]="!isSlotActive(slot) && slot.available"
                      [class.border-(--hairline-light)]="!isSlotActive(slot)"
                      [class.hover:bg-(--surface-light)]="!isSlotActive(slot) && slot.available"
                      [class.bg-gray-100]="!slot.available"
                      [class.text-gray-400]="!slot.available"
                      [class.cursor-not-allowed]="!slot.available"
                      [class.opacity-60]="!slot.available"
                    >
                      <div class="flex items-center gap-3">
                        <span
                          class="w-3 h-3 rounded-full shrink-0"
                          [class.bg-(--voltage-orange)]="isSlotActive(slot)"
                          [class.bg-emerald-500]="!isSlotActive(slot) && slot.available"
                          [class.bg-gray-300]="!slot.available"
                        ></span>
                        <div>
                          <div class="font-bold text-xs sm:text-sm">
                            Slot {{ slot.name }} ({{ slot.start_time }} - {{ slot.end_time }})
                          </div>
                          <div class="text-[11px] font-mono mt-0.5" [class.text-white/70]="isSlotActive(slot)" [class.text-(--brand-ink)/60]="!isSlotActive(slot)">
                            {{ slot.reason }}
                          </div>
                        </div>
                      </div>

                      @if (isSlotActive(slot)) {
                        <span class="px-2 py-0.5 rounded bg-(--voltage-orange) text-white font-mono text-[10px] font-bold uppercase">
                          PILIHAN ANDA
                        </span>
                      } @else if (slot.available) {
                        <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold uppercase">
                          TERSEDIA
                        </span>
                      } @else {
                        <span class="px-2 py-0.5 rounded bg-gray-200 text-gray-500 font-mono text-[10px] font-bold uppercase">
                          PENUH / BUFFER
                        </span>
                      }
                    </button>

                    <!-- LOCKED 90M Transit Band separator between slots -->
                    @if (idx < availableSlots().length - 1) {
                      <div class="px-4 py-2 rounded-lg bg-gray-100/80 border border-(--hairline-light)/60 flex items-center justify-between text-[11px] font-mono text-(--brand-ink)/60 select-none">
                        <div class="flex items-center gap-2">
                          <span class="text-xs">&#128274;</span>
                          <span>Jeda Transit &amp; Sanitasi Alat (Terkunci Otomatis Antar-Klien)</span>
                        </div>
                        <span class="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold tracking-wider text-[10px]">
                          LOCKED 90M
                        </span>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </section>

          <!-- SECTION 04 / DETAIL PEMESAN & ALAMAT -->
          <section class="space-y-4 bg-white p-6 rounded-xl border border-(--hairline-light) shadow-xs">
            <div class="flex items-baseline justify-between border-b border-(--hairline-light) pb-3">
              <div>
                <span class="font-mono text-[10px] text-(--voltage-orange) tracking-widest uppercase font-bold block mb-1">
                  04 / DETAIL PEMESAN &amp; ALAMAT
                </span>
                <h3 class="text-lg sm:text-xl font-bold text-(--brand-ink)">
                  Data Lokasi &amp; Catatan Khusus
                </h3>
              </div>
              <p class="text-xs text-(--brand-ink)/60 hidden sm:inline-block">
                Informasi ini akan terangkum rapi ke dalam teks konfirmasi WhatsApp
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nama Pemesan -->
              <div class="space-y-1.5">
                <label for="clientFullNameInput" class="block text-xs font-bold font-mono uppercase tracking-wider text-(--brand-ink)">
                  Nama Lengkap Pemesan <span class="text-(--voltage-orange)">*</span>
                </label>
                <input
                  id="clientFullNameInput"
                  type="text"
                  [ngModel]="formDraft().clientFullName"
                  (ngModelChange)="onFieldChange('clientFullName', $event)"
                  name="clientFullName"
                  placeholder="Nama Anda..."
                  class="m3-field-outlined"
                  [class.m3-field-error]="validationErrors()['client_name']"
                />
                @if (validationErrors()['client_name']) {
                  <p role="alert" class="text-xs text-red-600 font-mono font-semibold">
                    {{ validationErrors()['client_name'] }}
                  </p>
                }
              </div>

              <!-- WhatsApp Pemesan -->
              <div class="space-y-1.5">
                <label for="clientContactPhoneInput" class="block text-xs font-bold font-mono uppercase tracking-wider text-(--brand-ink)">
                  Nomor WhatsApp Aktif <span class="text-(--voltage-orange)">*</span>
                </label>
                <input
                  id="clientContactPhoneInput"
                  type="tel"
                  [ngModel]="formDraft().clientContactPhone"
                  (ngModelChange)="onFieldChange('clientContactPhone', $event)"
                  name="clientContactPhone"
                  placeholder="08xxxxxxxxxx"
                  class="m3-field-outlined font-mono"
                />
              </div>
            </div>

            <!-- Alamat Detail -->
            <div class="space-y-1.5">
              <label for="serviceLocationAddressInput" class="block text-xs font-bold font-mono uppercase tracking-wider text-(--brand-ink)">
                Alamat Detail &amp; Patokan Rumah <span class="text-(--voltage-orange)">*</span>
              </label>
              <textarea
                id="serviceLocationAddressInput"
                rows="2"
                [ngModel]="formDraft().serviceLocationAddress"
                (ngModelChange)="onFieldChange('serviceLocationAddress', $event)"
                name="serviceLocationAddress"
                placeholder="Contoh: Jl. Senopati No. 4, Kebayoran Baru (Pagar abu-abu, seberang minimarket)"
                class="m3-field-outlined resize-none"
                [class.m3-field-error]="validationErrors()['location']"
              ></textarea>
              @if (validationErrors()['location']) {
                <p role="alert" class="text-xs text-red-600 font-mono font-semibold">
                  {{ validationErrors()['location'] }}
                </p>
              }
            </div>

            <!-- Instruksi / Catatan Khusus -->
            <div class="space-y-1.5">
              <label for="additionalClientNotesInput" class="block text-xs font-bold font-mono uppercase tracking-wider text-(--brand-ink)">
                Instruksi Spesifik / Catatan untuk Teknisi
              </label>
              <textarea
                id="additionalClientNotesInput"
                rows="2"
                [ngModel]="formDraft().additionalClientNotes"
                (ngModelChange)="onFieldChange('additionalClientNotes', $event)"
                name="additionalClientNotes"
                placeholder="Contoh: Mohon bawa tangga lipat, fokus pembersihan kerak kamar mandi utama"
                class="m3-field-outlined resize-none"
              ></textarea>
            </div>
          </section>
        </div>

        <!-- ======================= RIGHT STREAM: STICKY BOOKING TERMINAL (4 COLS) ======================= -->
        <div class="lg:col-span-4 sticky top-24 space-y-4">
          <div class="bg-white rounded-xl shadow-md border border-(--hairline-light) overflow-hidden space-y-4">
            <!-- Terminal Header -->
            <div class="p-5 bg-(--surface-light) border-b border-(--hairline-light) space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[10px] uppercase font-bold text-(--brand-ink)/60 tracking-wider">
                  RINGKASAN ESTIMASI MANDIRI
                </span>
                <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] uppercase font-bold">
                  Bebas Komisi 0%
                </span>
              </div>
              <h4 class="text-base font-bold text-(--brand-ink)">
                Rincian Pembayaran
              </h4>

              @if (selectedTimeSlot(); as activeSlot) {
                <div class="p-2.5 bg-white rounded-lg flex items-center justify-between text-xs font-mono shadow-xs mt-2 border border-(--hairline-light)">
                  <span class="font-bold text-(--brand-ink)">{{ selectedBookingDate() }}</span>
                  <span class="text-(--voltage-orange) font-bold">{{ activeSlot.start_time }} - {{ activeSlot.end_time }} WIB</span>
                </div>
              }
            </div>

            <!-- Ledger Financial Breakdown -->
            <div class="p-5 space-y-3 font-mono text-xs">
              <!-- Line 1: Layanan Dasar -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-bold text-(--brand-ink)">
                    {{ selectedService()?.name || 'Layanan Belum Dipilih' }}
                  </div>
                  @if (isHourlyService()) {
                    <div class="text-[11px] text-(--brand-ink)/60">
                      {{ hourlyDuration() }} Jam @ {{ formattedServicePrice() }}
                    </div>
                  }
                </div>
                <span class="font-bold text-(--brand-ink)">
                  {{ formattedServicePrice() }}
                </span>
              </div>

              <!-- Line 2: Ongkos Jarak Transportasi -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-bold text-(--brand-ink)">
                    Ongkos Jarak Transportasi
                  </div>
                  @if (feeCalculation(); as fee) {
                    <div class="text-[11px] text-(--brand-ink)/60">
                      {{ fee.distance_km }} km (Subsidi {{ fee.free_radius_km }} km)
                    </div>
                  }
                </div>
                <span class="font-bold text-(--brand-ink)">
                  {{ feeCalculation() ? formatCurrency(feeCalculation()!.transport_fee) : 'Rp 0' }}
                </span>
              </div>

              <!-- Line 3: Proteksi Alat -->
              <div class="flex items-start justify-between text-emerald-800">
                <div>
                  <div class="font-bold">Proteksi Alat &amp; Sanitasi</div>
                  <div class="text-[11px] text-emerald-700">Peralatan standar mandiri</div>
                </div>
                <span class="font-bold">Rp 0 (Termasuk)</span>
              </div>

              <!-- Total Estimasi Banner -->
              <div class="pt-3 mt-3 border-t border-(--hairline-light) bg-(--surface-light) p-3 rounded-lg flex items-baseline justify-between">
                <div>
                  <span class="font-mono text-[10px] font-bold uppercase text-(--brand-ink)/60 tracking-wider block">
                    TOTAL PEMESANAN
                  </span>
                  <span class="text-[11px] text-(--brand-ink)/60">Langsung ke teknisi</span>
                </div>
                <span class="font-mono-rate text-xl font-bold text-(--voltage-orange)">
                  {{ formattedTotalEstimate() }}
                </span>
              </div>

              <!-- Dispatch WhatsApp Button (type="submit") -->
              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="isSubmitting() || isOutOfRadius() || !hasActiveProfile()"
                  class="w-full min-h-[48px] px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  [class.bg-(--whatsapp-green)]="!isOutOfRadius()"
                  [class.hover:bg-(--whatsapp-green-hover)]="!isOutOfRadius()"
                  [class.text-white]="!isOutOfRadius()"
                  [class.bg-gray-300]="isOutOfRadius()"
                  [class.text-gray-500]="isOutOfRadius()"
                  [class.cursor-not-allowed]="isOutOfRadius()"
                >
                  @if (isSubmitting()) {
                    <span>Menyimpan Reservasi...</span>
                  } @else if (isOutOfRadius()) {
                    <span>Di Luar Jangkauan</span>
                  } @else {
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span>Lanjutkan Pemesanan via WhatsApp</span>
                  }
                </button>
                <p class="text-[11px] text-(--brand-ink)/60 text-center mt-2 leading-relaxed">
                  Format reservasi &amp; kalkulasi akan terisi otomatis untuk chat langsung ke mitra teknisi. Tanpa akun atau login.
                </p>
              </div>

              <!-- Trust & Guarantee Checklist -->
              <div class="pt-2 border-t border-(--hairline-light) space-y-1.5 text-[11px] text-(--brand-ink)/70">
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-700 font-bold">&#10003;</span>
                  <span>100% Pembayaran langsung tanpa potongan aplikasi</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-700 font-bold">&#10003;</span>
                  <span>Jaminan kepatuhan transit buffer 90 menit</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-700 font-bold">&#10003;</span>
                  <span>Hubungan langsung mandiri &amp; terlindungi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  `,
})
export class ServiceBookingFormComponent {
  readonly selectedService = input<PublicServiceCatalogItem | null>(null);
  readonly formattedServicePrice = input<string>('Rp 0');
  readonly formattedTotalEstimate = input<string>('Rp 0');
  readonly serverErrorMessage = input<string | null>(null);
  readonly validationErrors = input<Record<string, string>>({});
  readonly isSubmitting = input<boolean>(false);
  readonly hasActiveProfile = input<boolean>(true);
  readonly formDraft = input.required<BookingFormDraft>();
  readonly clientCoordinates = input<{ lat: number; lng: number } | null>(null);
  readonly feeCalculation = input<FeeCalculationResult | null>(null);
  readonly isCalculatingFee = input<boolean>(false);
  readonly feeCalculationError = input<string | null>(null);
  readonly isOutOfRadius = input<boolean>(false);
  readonly availableSlots = input<readonly AvailableTimeSlot[]>([]);
  readonly isSlotsLoading = input<boolean>(false);
  readonly slotsErrorMessage = input<string | null>(null);
  readonly selectedTimeSlot = input<AvailableTimeSlot | null>(null);
  readonly selectedBookingDate = input<string>('');
  readonly isSelectedDateWorkingDay = input<boolean>(true);

  readonly dateChange = output<string>();
  readonly slotSelect = output<AvailableTimeSlot>();
  readonly clientCoordinatesChange = output<{ lat: number; lng: number }>();
  readonly formDraftChange = output<BookingFormDraft>();
  readonly clearFieldError = output<string>();
  readonly submitForm = output<void>();

  readonly hourlyDuration = signal<number>(2.5);

  readonly isHourlyService = computed(() => {
    const service = this.selectedService();
    if (!service) return true;
    return (service.rate_type || '').toUpperCase() !== 'UNIT';
  });

  readonly formattedBaseTotal = computed(() => {
    const service = this.selectedService();
    if (!service) return 'Rp 0';
    const rate = service.base_price || service.price;
    const total = rate * this.hourlyDuration();
    return this.formatCurrency(total);
  });

  readonly markerPositionPercent = computed(() => {
    const fee = this.feeCalculation();
    if (!fee || !fee.max_radius_km || fee.max_radius_km <= 0) return null;
    const ratio = Math.min(fee.distance_km / fee.max_radius_km, 1.0);
    return Math.round(ratio * 100);
  });

  stepDuration(delta: number): void {
    const current = this.hourlyDuration();
    const next = Math.max(2.0, Math.min(8.0, current + delta));
    this.hourlyDuration.set(next);
  }

  onFieldChange(field: keyof BookingFormDraft, value: string): void {
    const updated = { ...this.formDraft(), [field]: value };
    this.formDraftChange.emit(updated);
    this.clearFieldError.emit(field);
  }

  onCoordinatesSelected(coords: { lat: number; lng: number }): void {
    this.clientCoordinatesChange.emit(coords);
  }

  onDatePickerChange(dateStr: string): void {
    this.dateChange.emit(dateStr);
  }

  onSlotClick(slot: AvailableTimeSlot): void {
    if (!slot.available) return;
    this.slotSelect.emit(slot);

    const bookingDate = this.selectedBookingDate();
    if (bookingDate && slot.start_time) {
      const scheduledIso = `${bookingDate}T${slot.start_time}:00`;
      this.onFieldChange('reservationScheduledDate', scheduledIso);
    }
  }

  isSlotActive(slot: AvailableTimeSlot): boolean {
    const active = this.selectedTimeSlot();
    return active?.slot_type === slot.slot_type;
  }

  triggerSubmit(): void {
    this.submitForm.emit();
  }

  getChargeableKm(fee: FeeCalculationResult): number {
    return Math.max(0, Number((fee.distance_km - fee.free_radius_km).toFixed(1)));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
