import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filterNumericInput, sanitizePlainText } from '../../../../../core/utils/sanitize.utils';
import {
  PublicServiceCatalogItem,
  PublicTechnicianProfile,
} from '../../../models/worker-catalog.model';
import {
  AvailableTimeSlot,
  FeeCalculationResult,
} from '../../../models/service-booking.model';
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
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-start">
        <!-- ======================= LEFT STREAM: MAIN BOOKING CONFIGURATION (8 cols) ======================= -->
        <div class="lg:col-span-8 space-y-space-3xl">
          <!-- SECTION 1: Pilih Model Layanan & Pengaturan Tarif -->
          <div class="space-y-space-lg">
            <div class="flex items-baseline justify-between">
              <div>
                <span class="font-micro-uppercase text-micro-uppercase text-voltage-orange tracking-widest uppercase font-bold block mb-1">
                  01 / LAYANAN &amp; DURASI
                </span>
                <h2 class="font-heading-h2 text-heading-h2 font-bold text-on-surface">
                  Pilih Spesifikasi Pembersihan
                </h2>
              </div>
              <span class="font-caption text-caption text-ink-secondary hidden sm:inline-block">
                Disesuaikan dengan volume hunian
              </span>
            </div>

            <!-- Service Cards Grid -->
            @if (displayServices().length > 0) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                @for (serviceItem of displayServices(); track serviceItem.id) {
                  <div
                    role="button"
                    tabindex="0"
                    (click)="onSelectService(serviceItem)"
                    (keydown.enter)="onSelectService(serviceItem)"
                    (keydown.space)="$event.preventDefault(); onSelectService(serviceItem)"
                    [class]="selectedService()?.id === serviceItem.id
                      ? 'p-space-lg rounded-xl cursor-pointer transition-all bg-surface-container-lowest shadow-md ring-2 ring-voltage-orange relative'
                      : 'p-space-lg rounded-xl cursor-pointer transition-all bg-surface-container-low hover:bg-surface-container shadow-sm opacity-85'"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        @if (selectedService()?.id === serviceItem.id) {
                          <span class="inline-block px-space-xs py-0.5 rounded bg-voltage-orange text-ink-on-dark font-micro-uppercase text-micro-uppercase uppercase font-bold">
                            PILIHAN TERPILIH
                          </span>
                        } @else {
                          <span class="inline-block px-space-xs py-0.5 rounded bg-surface-container-high text-ink-secondary font-micro-uppercase text-micro-uppercase uppercase font-bold">
                            STANDAR
                          </span>
                        }
                        <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface mt-1">
                          {{ serviceItem.name }}
                        </h3>
                      </div>
                      <span class="font-mono-rate text-mono-rate font-bold text-on-surface">
                        {{ formatServicePriceTag(serviceItem) }}
                      </span>
                    </div>
                    <p class="font-caption text-caption text-ink-secondary mt-2">
                      {{ serviceItem.description }}
                    </p>
                  </div>
                }
              </div>
            } @else if (selectedService(); as selectedSvc) {
              <div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-md ring-2 ring-voltage-orange relative">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="inline-block px-space-xs py-0.5 rounded bg-voltage-orange text-ink-on-dark font-micro-uppercase text-micro-uppercase uppercase font-bold">
                      PILIHAN TERPILIH
                    </span>
                    <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface mt-1">
                      {{ selectedSvc.name }}
                    </h3>
                  </div>
                  <span class="font-mono-rate text-mono-rate font-bold text-on-surface">
                    {{ formattedServicePrice() }}
                  </span>
                </div>
                <p class="font-caption text-caption text-ink-secondary mt-2">
                  {{ selectedSvc.description }}
                </p>
              </div>
            } @else {
              <div class="p-space-lg bg-surface-highlight rounded-xl text-caption text-ink-secondary flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-warning">info</span>
                <span>Mitra ini belum menentukan paket layanan aktif di katalog. Reservasi belum dapat diproses.</span>
              </div>
            }

            @if (validationErrors()['service']) {
              <p role="alert" class="text-caption text-error font-mono-rate">
                {{ validationErrors()['service'] }}
              </p>
            }

            <!-- Interactive Duration Stepper (Hourly Services) -->
            @if (isHourlyService()) {
              <div class="p-space-lg bg-surface-highlight rounded-xl shadow-sm space-y-space-md" id="durationContainer">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div>
                    <div class="font-body-strong text-body-strong text-on-surface">
                      Durasi Pengerjaan {{ selectedService()?.name || 'Deep Clean' }}
                    </div>
                    <p class="font-caption text-caption text-ink-secondary">
                      Minimal pengerjaan 2.0 Jam untuk standardisasi mutu detailing mandiri.
                    </p>
                  </div>
                  <!-- Stepper Counter -->
                  <div class="flex items-center gap-space-sm bg-body-canvas px-space-md py-1.5 rounded-lg shadow-sm">
                    <button
                      class="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors font-bold text-lg disabled:opacity-30 cursor-pointer"
                      (click)="stepDuration(-0.5)"
                      [disabled]="hourlyDuration() <= 2.0"
                      title="Kurangi 30 Menit"
                      type="button"
                    >
                      -
                    </button>
                    <div class="w-24 text-center">
                      <span class="font-mono-rate text-mono-rate font-bold text-on-surface text-base" id="durationDisplay">
                        {{ hourlyDuration().toFixed(1) }} Jam
                      </span>
                    </div>
                    <button
                      class="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors font-bold text-lg disabled:opacity-30 cursor-pointer"
                      (click)="stepDuration(0.5)"
                      [disabled]="hourlyDuration() >= 8.0"
                      title="Tambah 30 Menit"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
                <!-- Real-time Formula Note -->
                <div class="flex items-center gap-space-xs font-mono-rate text-mono-rate text-ink-secondary text-xs pt-1">
                  <span class="material-symbols-outlined text-[16px] text-accent-link">calculate</span>
                  <span>
                    Kalkulasi Dasar: {{ hourlyDuration().toFixed(1) }} jam × {{ formattedServicePrice() }} = <strong class="text-on-surface" id="baseServiceTotalDisplay">{{ formattedBaseTotal() }}</strong>
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- SECTION 2: Kalkulator Radius & Ongkos Jalan Otomatis -->
          <div class="space-y-space-lg">
            <div>
              <span class="font-micro-uppercase text-micro-uppercase text-voltage-orange tracking-widest uppercase font-bold block mb-1">
                02 / LOGISTIK MANDIRI
              </span>
              <h2 class="font-heading-h2 text-heading-h2 font-bold text-on-surface">
                Kalkulator Radius &amp; Ongkos Jalan Otomatis
              </h2>
              <p class="font-caption text-caption text-ink-secondary">
                Transparansi subsidi radius perjalanan pekerja dari pangkalan {{ workerProfile()?.zone || 'Tebet' }}.
              </p>
            </div>

            <!-- Location Selector Box -->
            <div class="p-space-lg bg-surface-container-lowest rounded-xl shadow-md space-y-space-lg">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-space-md items-center">
                <div class="sm:col-span-8 space-y-1">
                  <label
                    for="clientLocationInput"
                    class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary"
                  >
                    Titik Lokasi Klien / Titik Antar
                  </label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-3 text-[18px] text-ink-disabled">my_location</span>
                    <input
                      class="w-full h-11 pl-10 pr-3 bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-body-default text-body-default outline-none shadow-inner"
                      id="clientLocationInput"
                      maxlength="255"
                      placeholder="Masukkan kelurahan atau kecamatan..."
                      type="text"
                      [ngModel]="formDraft().serviceLocationAddress"
                      (ngModelChange)="onFieldChange('serviceLocationAddress', $event)"
                      name="serviceLocationAddress"
                    />
                  </div>
                </div>
                <div class="sm:col-span-4 flex flex-col justify-end">
                  <span class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary mb-1">
                    Jarak Terkalkulasi
                  </span>
                  <div class="h-11 px-space-md bg-surface-warm-promo text-promo-ink rounded flex items-center justify-between font-mono-rate text-mono-rate font-bold">
                    <span>JARAK: {{ currentDistanceKm() }} KM</span>
                    <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  </div>
                </div>
              </div>

              <!-- Location Map Picker -->
              <app-location-map-picker
                [latitude]="clientCoordinates()?.lat ?? null"
                [longitude]="clientCoordinates()?.lng ?? null"
                [radiusKm]="feeCalculation()?.max_radius_km ?? (workerProfile()?.max_radius_km || 5.0)"
                label="Titik Antar / Lokasi Pemesan di Peta"
                helperText="Pilih titik koordinat pada peta atau gunakan GPS agar tarif ongkos jalan terhitung otomatis."
                (coordinatesChange)="onCoordinatesSelected($event)"
              />

              <!-- SVG Visual Radius Bar Diagram -->
              <div class="space-y-space-xs pt-space-xs">
                <div class="flex flex-wrap items-center justify-between font-caption text-caption gap-1">
                  <span class="font-bold text-success flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-success"></span> 0.0 - {{ freeRadiusKm() }} Km (Subsidi Bebas Ongkir)
                  </span>
                  <span class="font-bold text-warning flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-warning"></span> {{ freeRadiusKm() }} - {{ maxRadiusKm() }} Km (+Rp {{ formattedFeePerKm() }} / km)
                  </span>
                  <span class="font-bold text-error flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-error"></span> &gt; {{ maxRadiusKm() }} Km (Di Luar Jangkauan)
                  </span>
                </div>
                <!-- Custom Step Meter SVG Bar -->
                <div class="w-full bg-surface-container h-4 rounded-full overflow-hidden flex relative">
                  <!-- Free Tier -->
                  <div class="h-full bg-success/80" [style.width.%]="freeTierPercent()" [title]="'Gratis Ongkir (0 - ' + freeRadiusKm() + ' km)'"></div>
                  <!-- Surcharged Tier -->
                  <div class="h-full bg-warning/80" [style.width.%]="100 - freeTierPercent()" [title]="'Zona Tambahan (' + freeRadiusKm() + ' - ' + maxRadiusKm() + ' km)'"></div>
                  <!-- Active Marker -->
                  @if (markerPositionPercent(); as mPos) {
                    <div class="absolute top-0 bottom-0 w-1.5 bg-hero-canvas shadow-lg" [style.left.%]="mPos" [title]="'Posisi Anda: ' + currentDistanceKm() + ' km'"></div>
                  }
                </div>
                <div class="flex justify-between font-mono-rate text-micro-uppercase text-ink-disabled pt-0.5">
                  <span>0 KM (BASECAMP {{ (workerProfile()?.zone || 'Tebet').toUpperCase() }})</span>
                  <span>{{ freeRadiusKm() }} KM (BATAS GRATIS)</span>
                  <span class="text-on-surface font-bold">{{ currentDistanceKm() }} KM (LOKASI ANDA)</span>
                  <span>{{ maxRadiusKm() }} KM (MAKSIMAL)</span>
                </div>
              </div>

              <!-- Transport Breakdown Ledger Box -->
              <div class="p-space-md bg-warning-surface rounded-lg flex items-start gap-space-sm text-warning font-caption text-caption">
                <span class="material-symbols-outlined text-[20px] shrink-0">info</span>
                <div class="space-y-0.5 leading-relaxed">
                  <strong class="font-body-strong text-body-strong block">Perhitungan Biaya Transportasi Otomatis:</strong>
                  @if (chargeableKm() > 0) {
                    Radius dasar gratis hingga {{ freeRadiusKm() }} km. Jarak ekstra dihitung: ({{ currentDistanceKm() }} km - {{ freeRadiusKm() }} km) = <strong>{{ chargeableKm() }} km</strong> × Rp {{ formattedFeePerKm() }}/km = <strong class="font-mono-rate text-mono-rate">{{ formattedTransportFee() }}</strong>.
                  } @else {
                    Radius dasar gratis hingga {{ freeRadiusKm() }} km. Titik lokasi Anda ({{ currentDistanceKm() }} km) berada dalam jangkauan subsidi bebas ongkir (<strong class="font-mono-rate text-mono-rate">Rp 0</strong>).
                  }
                </div>
              </div>

              @if (feeCalculationError(); as calcError) {
                <div
                  role="alert"
                  class="p-space-md border rounded-xl text-caption font-mono-rate space-y-1"
                  [class.bg-error-surface]="isOutOfRadius()"
                  [class.border-error]="isOutOfRadius()"
                  [class.text-error]="isOutOfRadius()"
                  [class.bg-warning-surface]="!isOutOfRadius()"
                  [class.border-warning]="!isOutOfRadius()"
                  [class.text-warning]="!isOutOfRadius()"
                >
                  <div class="font-bold uppercase tracking-wider">
                    @if (isOutOfRadius()) {
                      Di Luar Jangkauan Layanan
                    } @else {
                      Informasi Ongkos Jalan
                    }
                  </div>
                  <div>{{ calcError }}</div>
                </div>
              }
            </div>
          </div>

          <!-- SECTION 3: Kalender Slot Waktu & Proteksi Buffer Transit -->
          <div class="space-y-space-lg">
            <div>
              <span class="font-micro-uppercase text-micro-uppercase text-voltage-orange tracking-widest uppercase font-bold block mb-1">
                03 / JADWAL &amp; BUFFER DISIPLIN
              </span>
              <h2 class="font-heading-h2 text-heading-h2 font-bold text-on-surface">
                Pilih Slot Tanggal &amp; Waktu
              </h2>
              <p class="font-caption text-caption text-ink-secondary">
                Sistem mengunci otomatis jeda istirahat dan perpindahan transit selama 90 menit antar-klien.
              </p>
            </div>

            <!-- Date Selectors -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
              @for (dayOption of dateOptions(); track dayOption.dateStr) {
                <button
                  [class]="dayOption.isFull
                    ? 'p-space-md rounded-xl bg-surface-container-low text-ink-disabled cursor-not-allowed text-left opacity-75'
                    : dayOption.dateStr === selectedBookingDate()
                      ? 'p-space-md rounded-xl bg-hero-canvas text-ink-on-dark text-left shadow-md ring-2 ring-voltage-orange transition-all cursor-pointer'
                      : 'p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-left transition-colors shadow-sm cursor-pointer'"
                  [disabled]="dayOption.isFull"
                  (click)="selectDateOption(dayOption.dateStr)"
                  type="button"
                >
                  <div class="flex items-center justify-between">
                    <span [class]="dayOption.dateStr === selectedBookingDate() ? 'font-micro-uppercase text-micro-uppercase uppercase text-voltage-orange font-bold' : 'font-micro-uppercase text-micro-uppercase uppercase text-ink-secondary block'">
                      {{ dayOption.label }}
                    </span>
                    @if (dayOption.dateStr === selectedBookingDate()) {
                      <span class="w-2 h-2 rounded-full bg-voltage-orange"></span>
                    }
                  </div>
                  <span [class]="dayOption.dateStr === selectedBookingDate() ? 'font-body-strong text-body-strong block text-ink-on-dark' : 'font-body-strong text-body-strong block text-on-surface'">
                    {{ dayOption.dateFormatted }}
                  </span>
                  <span [class]="dayOption.dateStr === selectedBookingDate() ? 'font-caption text-caption text-surface-highlight font-medium' : 'font-caption text-caption text-ink-secondary'">
                    {{ dayOption.slotCountLabel }}
                  </span>
                </button>
              }
            </div>

            <!-- Date Picker fallback -->
            <div class="flex items-center gap-space-sm pt-1">
              <label for="reservationDateInput" class="font-caption text-caption text-ink-secondary">
                Atau pilih tanggal lain:
              </label>
              <input
                id="reservationDateInput"
                type="date"
                [ngModel]="selectedBookingDate()"
                (ngModelChange)="onDatePickerChange($event)"
                name="reservationScheduledDate"
                class="h-9 px-space-md bg-surface-highlight hover:bg-surface-container focus:bg-body-canvas rounded text-on-surface font-mono-rate text-caption outline-none border border-hairline-subtle"
                [class.border-error]="validationErrors()['booking_date']"
              />
            </div>
            @if (validationErrors()['booking_date']) {
              <p role="alert" class="text-caption text-error font-mono-rate">
                {{ validationErrors()['booking_date'] }}
              </p>
            }

            <!-- Time Slots Grid Matrix with Protected Buffer Bands -->
            <div class="space-y-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-md">
              <div class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary tracking-wider pb-1">
                JADWAL OPERASIONAL {{ operationalHeaderDate() }}
              </div>

              @if (isSlotsLoading()) {
                <div class="space-y-space-sm animate-pulse" aria-label="Memuat ketersediaan slot waktu">
                  <div class="h-16 bg-surface-container rounded-lg"></div>
                  <div class="h-10 bg-surface-container-high/60 rounded-lg"></div>
                  <div class="h-16 bg-surface-container rounded-lg"></div>
                </div>
              } @else if (availableSlots().length === 0) {
                <div class="p-space-md bg-surface-highlight rounded-lg text-caption text-ink-secondary text-center">
                  Tidak ada jadwal operasional pada tanggal ini.
                </div>
              } @else {
                <div role="group" aria-label="Pilihan slot waktu kedatangan" class="space-y-space-sm">
                  @for (slot of availableSlots(); track slot.slot_type; let idx = $index) {
                    @if (isSlotActive(slot)) {
                      <!-- Selected Slot -->
                      <button
                        type="button"
                        (click)="onSlotClick(slot)"
                        class="w-full p-space-md rounded-lg bg-hero-canvas text-ink-on-dark flex items-center justify-between shadow-lg relative ring-2 ring-voltage-orange cursor-pointer text-left min-h-[48px]"
                      >
                        <div class="flex items-center gap-space-md">
                          <span class="w-3 h-3 rounded-full bg-voltage-orange animate-pulse"></span>
                          <div>
                            <div class="flex items-center gap-space-xs">
                              <span class="font-body-strong text-body-strong text-ink-on-dark">
                                Slot {{ slot.name }} ({{ slot.start_time }} - {{ slot.end_time }} WIB)
                              </span>
                              <span class="px-space-xs py-0.5 rounded bg-voltage-orange text-ink-on-dark font-micro-uppercase text-micro-uppercase font-bold">
                                PILIHAN ANDA
                              </span>
                            </div>
                            <p class="font-caption text-caption text-surface-variant">
                              Durasi booked {{ hourlyDuration() }} jam (Estimasi selesai {{ getEstimatedEndTime(slot) }} WIB)
                            </p>
                          </div>
                        </div>
                        <span class="material-symbols-outlined text-[20px] text-voltage-orange">check_circle</span>
                      </button>
                    } @else if (slot.available) {
                      <!-- Available Slot -->
                      <button
                        type="button"
                        (click)="onSlotClick(slot)"
                        class="w-full p-space-md rounded-lg bg-surface-highlight hover:bg-surface-container transition-all flex items-center justify-between cursor-pointer text-left min-h-[48px]"
                      >
                        <div class="flex items-center gap-space-md">
                          <span class="w-3 h-3 rounded-full bg-success"></span>
                          <div>
                            <span class="font-body-strong text-body-strong text-on-surface">
                              Slot {{ slot.name }} ({{ slot.start_time }} - {{ slot.end_time }} WIB)
                            </span>
                            <p class="font-caption text-caption text-ink-secondary">
                              {{ slot.reason || 'Tersedia untuk pengerjaan ' + hourlyDuration() + ' jam' }}
                            </p>
                          </div>
                        </div>
                        <span class="px-space-sm py-1 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase font-bold">
                          TERSEDIA
                        </span>
                      </button>
                    } @else {
                      <!-- Unavailable Slot -->
                      <button
                        type="button"
                        disabled
                        class="w-full p-space-md rounded-lg bg-surface-container-low text-ink-disabled flex items-center justify-between cursor-not-allowed opacity-60 text-left min-h-[48px]"
                      >
                        <div class="flex items-center gap-space-md">
                          <span class="w-3 h-3 rounded-full bg-surface-variant"></span>
                          <div>
                            <span class="font-body-strong text-body-strong text-ink-disabled">
                              Slot {{ slot.name }} ({{ slot.start_time }} - {{ slot.end_time }} WIB)
                            </span>
                            <p class="font-caption text-caption text-ink-disabled">
                              {{ slot.reason || 'Tidak tersedia / Telah terisi' }}
                            </p>
                          </div>
                        </div>
                        <span class="px-space-sm py-1 rounded bg-surface-container text-ink-disabled font-micro-uppercase text-micro-uppercase font-bold">
                          PENUH / BUFFER
                        </span>
                      </button>
                    }

                    <!-- LOCKED 90M Transit Band between slots -->
                    @if (idx < availableSlots().length - 1) {
                      <div class="px-space-md py-2.5 rounded-lg bg-surface-container-high/60 flex items-center justify-between select-none">
                        <div class="flex items-center gap-space-sm text-ink-disabled">
                          <span class="material-symbols-outlined text-[16px]">lock_clock</span>
                          <span class="font-mono-rate text-caption">
                            {{ slot.end_time }} - {{ availableSlots()[idx + 1].start_time }} WIB
                          </span>
                          <span class="font-caption text-caption italic">
                            Buffer Transit &amp; Sanitasi Alat (Terkunci Otomatis)
                          </span>
                        </div>
                        <span class="font-micro-uppercase text-micro-uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant">
                          LOCKED 90M
                        </span>
                      </div>
                    }
                  }
                </div>
              }
            </div>
            @if (validationErrors()['booking_time_slot']) {
              <p role="alert" class="text-caption text-error font-mono-rate">
                {{ validationErrors()['booking_time_slot'] }}
              </p>
            }
          </div>

          <!-- SECTION 4: Data Lokasi & Instruksi Pekerja -->
          <div class="space-y-space-lg">
            <div>
              <span class="font-micro-uppercase text-micro-uppercase text-voltage-orange tracking-widest uppercase font-bold block mb-1">
                04 / DETAIL PEMESAN &amp; ALAMAT
              </span>
              <h2 class="font-heading-h2 text-heading-h2 font-bold text-on-surface">
                Data Lokasi &amp; Catatan Khusus
              </h2>
              <p class="font-caption text-caption text-ink-secondary">
                Informasi ini akan terangkum rapi ke dalam teks konfirmasi WhatsApp {{ workerProfile()?.name || 'Pekerja' }}.
              </p>
            </div>

            <div class="p-space-lg bg-surface-container-lowest rounded-xl shadow-md space-y-space-md">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div class="space-y-1">
                  <label for="clientFullNameInput" class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary">
                    Nama Lengkap Pemesan <span class="text-voltage-orange">*</span>
                  </label>
                  <input
                    id="clientFullNameInput"
                    maxlength="100"
                    class="w-full h-11 px-space-md bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-body-default text-body-default outline-none shadow-inner"
                    [class.border]="validationErrors()['client_name']"
                    [class.border-error]="validationErrors()['client_name']"
                    placeholder="Nama Anda..."
                    type="text"
                    [ngModel]="formDraft().clientFullName"
                    (ngModelChange)="onFieldChange('clientFullName', $event)"
                    name="clientFullName"
                  />
                  @if (validationErrors()['client_name']) {
                    <p role="alert" class="text-caption text-error font-mono-rate">
                      {{ validationErrors()['client_name'] }}
                    </p>
                  }
                </div>

                <div class="space-y-1">
                  <label for="clientContactPhoneInput" class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary">
                    Nomor WhatsApp Aktif <span class="text-voltage-orange">*</span>
                  </label>
                  <input
                    id="clientContactPhoneInput"
                    maxlength="16"
                    class="w-full h-11 px-space-md bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-mono-rate text-mono-rate outline-none shadow-inner"
                    [class.border]="validationErrors()['client_phone']"
                    [class.border-error]="validationErrors()['client_phone']"
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                    inputmode="numeric"
                    [ngModel]="formDraft().clientContactPhone"
                    (input)="onPhoneInput($event)"
                    name="clientContactPhone"
                  />
                  @if (validationErrors()['client_phone']) {
                    <p role="alert" class="text-caption text-error font-mono-rate">
                      {{ validationErrors()['client_phone'] }}
                    </p>
                  }
                </div>
              </div>

              <div class="space-y-1">
                <label for="clientEmailAddressInput" class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary">
                  Alamat Email (Opsional)
                </label>
                <input
                  id="clientEmailAddressInput"
                  maxlength="100"
                  class="w-full h-11 px-space-md bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-body-default text-body-default outline-none shadow-inner"
                  [class.border]="validationErrors()['client_email']"
                  [class.border-error]="validationErrors()['client_email']"
                  placeholder="contoh: pemesan@email.com"
                  type="email"
                  [ngModel]="formDraft().clientEmailAddress"
                  (ngModelChange)="onFieldChange('clientEmailAddress', $event)"
                  name="clientEmailAddress"
                />
                @if (validationErrors()['client_email']) {
                  <p role="alert" class="text-caption text-error font-mono-rate">
                    {{ validationErrors()['client_email'] }}
                  </p>
                }
              </div>

              <div class="space-y-1">
                <label for="serviceLocationAddressInput" class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary">
                  Alamat Detail &amp; Patokan Rumah <span class="text-voltage-orange">*</span>
                </label>
                <textarea
                  id="serviceLocationAddressInput"
                  maxlength="255"
                  class="w-full p-space-md bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-body-default text-body-default outline-none shadow-inner resize-none"
                  [class.border]="validationErrors()['location']"
                  [class.border-error]="validationErrors()['location']"
                  rows="2"
                  [ngModel]="formDraft().serviceLocationAddress"
                  (ngModelChange)="onFieldChange('serviceLocationAddress', $event)"
                  name="serviceLocationAddress"
                  placeholder="Jl. Senopati Dalam No. 4A, Kebayoran Baru (Pagar Abu-abu, seberang Coffee Shop)"
                ></textarea>
                @if (validationErrors()['location']) {
                  <p role="alert" class="text-caption text-error font-mono-rate">
                    {{ validationErrors()['location'] }}
                  </p>
                }
              </div>

              <div class="space-y-1">
                <label for="additionalClientNotesInput" class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary">
                  Instruksi Spesifik / Catatan untuk {{ workerProfile()?.name || 'Pekerja' }}
                </label>
                <textarea
                  id="additionalClientNotesInput"
                  maxlength="500"
                  class="w-full p-space-md bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-body-default text-body-default outline-none shadow-inner resize-none"
                  rows="2"
                  [ngModel]="formDraft().additionalClientNotes"
                  (ngModelChange)="onFieldChange('additionalClientNotes', $event)"
                  name="additionalClientNotes"
                  placeholder="Tolong bawa cairan disinfektan sendiri, fokus pembersihan utama adalah..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================= RIGHT STREAM: STICKY BOOKING TERMINAL (4 cols) ======================= -->
        <div class="lg:col-span-4 sticky top-20 space-y-space-lg">
          <!-- Sticky Terminal Summary Card -->
          <div class="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden">
            <!-- Header Terminal -->
            <div class="p-space-lg bg-surface-highlight space-y-space-xs">
              <div class="flex items-center justify-between">
                <span class="font-micro-uppercase text-micro-uppercase uppercase font-bold text-ink-secondary tracking-wider">
                  RINGKASAN ESTIMASI MANDIRI
                </span>
                <span class="px-space-xs py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase font-bold">
                  Bebas Komisi 0%
                </span>
              </div>
              <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
                Rincian Perhitungan
              </h3>
              <span class="sr-only">Rincian Pembayaran</span>

              <!-- Selected Slot Badge -->
              <div class="p-space-sm bg-body-canvas rounded flex items-center justify-between text-caption font-caption shadow-sm mt-1">
                <div class="flex items-center gap-1.5 text-on-surface">
                  <span class="material-symbols-outlined text-[16px] text-voltage-orange">event_available</span>
                  <span class="font-body-strong text-body-strong">{{ selectedDateFormattedBadge() }}</span>
                </div>
                <span class="font-mono-rate text-mono-rate text-ink-secondary font-semibold">
                  {{ selectedSlotTimeBadge() }}
                </span>
              </div>
            </div>

            <!-- Itemized Financial Breakdown Ledger -->
            <div class="p-space-lg space-y-space-md font-body-default text-body-default">
              <!-- Line 1: Primary Service Base -->
              <div class="flex items-start justify-between">
                <div class="space-y-0.5">
                  <div class="font-body-strong text-body-strong text-on-surface" id="summaryServiceTitle">
                    {{ selectedService()?.name || 'Pilih Layanan' }}
                  </div>
                  <div class="font-caption text-caption text-ink-secondary" id="summaryServiceSub">
                    @if (isHourlyService()) {
                      {{ hourlyDuration().toFixed(1) }} Jam @ {{ formattedServicePrice() }} / jam
                    } @else {
                      1 Paket Sesi (Maks. 2 Jam Flat)
                    }
                  </div>
                </div>
                <span class="font-mono-rate text-mono-rate font-bold text-on-surface" id="summaryServicePrice">
                  {{ formattedBaseTotal() }}
                </span>
              </div>

              <!-- Line 2: Distance calculation -->
              <div class="flex items-start justify-between">
                <div class="space-y-0.5">
                  <div class="font-body-strong text-body-strong text-on-surface">Ongkos Jarak Transportasi</div>
                  <div class="font-caption text-caption text-ink-secondary">
                    {{ currentDistanceKm() }} km (Subsidi {{ freeRadiusKm() }} km, Sisa {{ chargeableKm() }} km)
                  </div>
                </div>
                <span class="font-mono-rate text-mono-rate font-bold text-on-surface" id="summaryDistancePrice">
                  {{ formattedTransportFee() }}
                </span>
              </div>

              <!-- Line 3: Tool & Sanitization Protection -->
              <div class="flex items-start justify-between">
                <div class="space-y-0.5">
                  <div class="font-body-strong text-body-strong text-on-surface">Proteksi Alat &amp; Sanitasi</div>
                  <div class="font-caption text-caption text-ink-secondary">Vakum industri, chemical, lap microfiber</div>
                </div>
                <span class="font-mono-rate text-mono-rate font-bold text-success">Rp 0 (Termasuk)</span>
              </div>

              <!-- Total Banner -->
              <div class="pt-space-md mt-space-md bg-surface-highlight p-space-md rounded-lg flex items-baseline justify-between shadow-inner">
                <div>
                  <span class="font-micro-uppercase text-micro-uppercase font-bold uppercase text-ink-secondary tracking-wider block">
                    TOTAL PEMESANAN
                  </span>
                  <span class="font-caption text-caption text-ink-secondary">
                    Langsung dibayarkan ke {{ workerProfile()?.name || 'Pekerja' }}
                  </span>
                </div>
                <span class="font-mono-rate text-mono-rate text-2xl font-bold text-voltage-orange" id="summaryGrandTotal">
                  {{ formattedGrandTotal() }}
                </span>
              </div>

              <!-- Dispatch Action CTA -->
              <div class="space-y-space-sm pt-space-xs">
                <!-- Feedback & Error Alerts in Sticky Terminal -->
                @if (serverErrorMessage()) {
                  <div role="alert" id="terminalServerErrorBanner" class="p-space-md rounded-lg bg-surface-container-high border border-error/30 text-caption space-y-1">
                    <div class="flex items-center gap-1.5 text-error font-bold font-body-strong">
                      <span class="material-symbols-outlined text-[18px]">error</span>
                      <span>Gagal Menyimpan Pemesanan</span>
                    </div>
                    <p class="text-on-surface-variant font-mono-rate leading-snug">{{ serverErrorMessage() }}</p>
                  </div>
                }

                @if (hasValidationErrors() && !serverErrorMessage()) {
                  <div role="alert" id="terminalValidationAlertBanner" class="p-space-md rounded-lg bg-surface-container-high border border-voltage-orange/30 text-caption space-y-1">
                    <div class="flex items-center gap-1.5 text-voltage-orange font-bold font-body-strong">
                      <span class="material-symbols-outlined text-[18px]">warning</span>
                      <span>Periksa Isian Formulir</span>
                    </div>
                    <p class="text-ink-secondary leading-snug">Lengkapi nama pemesan atau alamat lokasi di formulir sebelah kiri.</p>
                  </div>
                }

                <button
                  type="submit"
                  [disabled]="isSubmitting() || isOutOfRadius() || !hasActiveProfile() || !hasAvailableServices()"
                  class="w-full h-12 rounded font-button-label text-button-label font-bold flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  [class.bg-whatsapp-green]="!isOutOfRadius() && hasAvailableServices()"
                  [class.hover:bg-whatsapp-green-hover]="!isOutOfRadius() && hasAvailableServices()"
                  [class.text-on-primary]="!isOutOfRadius() && hasAvailableServices()"
                  [class.bg-surface-container]="isOutOfRadius() || !hasAvailableServices()"
                  [class.text-ink-disabled]="isOutOfRadius() || !hasAvailableServices()"
                >
                  @if (isSubmitting()) {
                    <span>Menyimpan Reservasi...</span>
                  } @else if (isOutOfRadius()) {
                    <span>Di Luar Jangkauan</span>
                  } @else if (!hasAvailableServices()) {
                    <span>Layanan Belum Tersedia</span>
                  } @else {
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"></path>
                    </svg>
                    <span>Lanjutkan Pemesanan via WhatsApp</span>
                  }
                </button>
                <p class="font-caption text-caption text-ink-secondary text-center leading-normal px-space-xs">
                  Format reservasi jadwal &amp; kalkulasi akan terisi otomatis untuk chat langsung ke {{ workerProfile()?.name || 'Pekerja' }}. Tanpa pembuatan akun atau login.
                </p>
              </div>

              <!-- Worker Guarantee & Trust Checklist -->
              <div class="pt-space-md space-y-space-xs font-caption text-caption text-ink-secondary">
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-[16px] text-success">verified_user</span>
                  <span>100% Pembayaran langsung tanpa potongan aplikasi</span>
                </div>
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-[16px] text-success">schedule</span>
                  <span>Penjadwalan otomatis dengan jeda transit buffer</span>
                </div>
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-[16px] text-success">handshake</span>
                  <span>Komunikasi dan transaksi langsung ke mitra</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Secondary Help Card -->
          <div class="p-space-md bg-surface-container rounded-lg flex items-center justify-between text-caption font-caption text-ink-secondary">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[18px]">support_agent</span>
              <span>Butuh konsultasi area hunian khusus?</span>
            </div>
            <a
              class="font-button-label text-button-label text-accent-link font-semibold hover:underline"
              [href]="tanyaWorkerWhatsAppUrl()"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya {{ workerFirstName() }}
            </a>
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
  readonly workerServices = input<readonly PublicServiceCatalogItem[]>([]);
  readonly workerProfile = input<PublicTechnicianProfile | null>(null);

  readonly dateChange = output<string>();
  readonly slotSelect = output<AvailableTimeSlot>();
  readonly clientCoordinatesChange = output<{ lat: number; lng: number }>();
  readonly formDraftChange = output<BookingFormDraft>();
  readonly clearFieldError = output<string>();
  readonly submitForm = output<void>();
  readonly serviceSelect = output<PublicServiceCatalogItem>();

  readonly hourlyDuration = signal<number>(2.5);
  readonly isDurationCustomized = signal<boolean>(false);

  readonly formattedFeePerKm = computed(() => {
    return new Intl.NumberFormat('id-ID').format(this.feePerKm());
  });

  readonly displayServices = computed(() => {
    const list = this.workerServices();
    if (list && list.length > 0) return list;
    const selected = this.selectedService();
    if (selected) return [selected];
    return [];
  });

  readonly hasAvailableServices = computed(() => this.displayServices().length > 0 || !!this.selectedService());

  readonly hasValidationErrors = computed(() => Object.keys(this.validationErrors()).length > 0);

  readonly isHourlyService = computed(() => {
    const service = this.selectedService();
    if (!service) return true;
    return (service.rate_type || '').toUpperCase() !== 'UNIT';
  });

  readonly formattedBaseTotal = computed(() => {
    const service = this.selectedService();
    if (!service) return 'Rp 0';
    const fee = this.feeCalculation();
    if (fee && fee.service_price != null && !this.isDurationCustomized()) {
      return this.formatCurrency(fee.service_price);
    }
    const rate = service.base_price || service.price;
    const total = this.isHourlyService() ? rate * this.hourlyDuration() : rate;
    return this.formatCurrency(total);
  });

  readonly currentDistanceKm = computed(() => {
    const fee = this.feeCalculation();
    if (fee && fee.distance_km != null) {
      return fee.distance_km;
    }
    return 4.2;
  });

  readonly freeRadiusKm = computed(() => {
    const fee = this.feeCalculation();
    if (fee && fee.free_radius_km != null) {
      return fee.free_radius_km;
    }
    return 3.0;
  });

  readonly maxRadiusKm = computed(() => {
    const fee = this.feeCalculation();
    if (fee && fee.max_radius_km != null) {
      return fee.max_radius_km;
    }
    const profile = this.workerProfile();
    return profile?.max_radius_km || 5.0;
  });

  readonly chargeableKm = computed(() => {
    const fee = this.feeCalculation();
    if (fee && fee.distance_km != null && fee.free_radius_km != null) {
      return Math.max(0, Number((fee.distance_km - fee.free_radius_km).toFixed(1)));
    }
    return 1.2;
  });

  readonly feePerKm = computed(() => {
    const fee = this.feeCalculation();
    return fee?.extra_fee_per_km || 3000;
  });

  readonly freeTierPercent = computed(() => {
    const free = this.freeRadiusKm();
    const max = this.maxRadiusKm();
    if (max <= 0) return 60;
    return Math.round((free / max) * 100);
  });

  readonly markerPositionPercent = computed(() => {
    const fee = this.feeCalculation();
    if (fee && fee.max_radius_km && fee.max_radius_km > 0) {
      const ratio = Math.min(fee.distance_km / fee.max_radius_km, 1.0);
      return Math.round(ratio * 100);
    }
    return 84;
  });

  readonly formattedTransportFee = computed(() => {
    const fee = this.feeCalculation();
    if (fee) {
      return this.formatCurrency(fee.transport_fee);
    }
    return 'Rp 3.600';
  });

  readonly formattedGrandTotal = computed(() => {
    if (!this.isDurationCustomized()) {
      const totalEst = this.formattedTotalEstimate();
      if (totalEst && totalEst !== 'Rp 0') {
        return totalEst;
      }
      const fee = this.feeCalculation();
      if (fee && fee.total_price != null) {
        return this.formatCurrency(fee.total_price);
      }
    }
    const service = this.selectedService();
    if (!service) return 'Rp 0';
    const fee = this.feeCalculation();
    const rate = service.base_price || service.price;
    const serviceCost = this.isHourlyService() ? rate * this.hourlyDuration() : rate;
    const transportFee = (fee && fee.transport_fee != null)
      ? fee.transport_fee
      : (this.feeCalculationError() ? 0 : 3600);
    return this.formatCurrency(serviceCost + transportFee);
  });

  readonly dateOptions = computed(() => {
    const options: Array<{
      dateStr: string;
      label: string;
      dateFormatted: string;
      slotCountLabel: string;
      isFull: boolean;
    }> = [];

    const today = new Date();
    const todayStr = this.formatDateIso(today);
    options.push({
      dateStr: todayStr,
      label: 'HARI INI',
      dateFormatted: `${today.getDate()} ${this.getMonthName(today.getMonth())}`,
      slotCountLabel: 'Penuh',
      isFull: true,
    });

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.formatDateIso(tomorrow);
    options.push({
      dateStr: tomorrowStr,
      label: 'BESOK',
      dateFormatted: `${tomorrow.getDate()} ${this.getMonthName(tomorrow.getMonth())}`,
      slotCountLabel: '3 Slot Siap',
      isFull: false,
    });

    const lusa = new Date(today);
    lusa.setDate(lusa.getDate() + 2);
    const lusaStr = this.formatDateIso(lusa);
    options.push({
      dateStr: lusaStr,
      label: 'LUSA',
      dateFormatted: `${lusa.getDate()} ${this.getMonthName(lusa.getMonth())}`,
      slotCountLabel: '4 Slot Siap',
      isFull: false,
    });

    const day3 = new Date(today);
    day3.setDate(day3.getDate() + 3);
    const day3Str = this.formatDateIso(day3);
    const dayName = this.getDayName(day3.getDay());
    options.push({
      dateStr: day3Str,
      label: dayName.toUpperCase(),
      dateFormatted: `${day3.getDate()} ${this.getMonthName(day3.getMonth())}`,
      slotCountLabel: '5 Slot Siap',
      isFull: false,
    });

    return options;
  });

  readonly operationalHeaderDate = computed(() => {
    const dateStr = this.selectedBookingDate();
    if (!dateStr) return 'BESOK (SABTU, 25 MEI 2025)';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const dayName = this.getDayName(date.getDay());
    const monthName = this.getMonthName(date.getMonth());
    return `${dayName.toUpperCase()}, ${date.getDate()} ${monthName.toUpperCase()} ${date.getFullYear()}`;
  });

  readonly selectedDateFormattedBadge = computed(() => {
    const dateStr = this.selectedBookingDate();
    if (!dateStr) return 'Sabtu, 25 Mei';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${this.getDayName(date.getDay())}, ${date.getDate()} ${this.getMonthName(date.getMonth())}`;
  });

  readonly selectedSlotTimeBadge = computed(() => {
    const slot = this.selectedTimeSlot();
    if (slot) {
      return `${slot.start_time} - ${slot.end_time} WIB`;
    }
    const available = this.availableSlots().find((s) => s.available);
    if (available) {
      return `${available.start_time} - ${available.end_time} WIB`;
    }
    return '13:00 - 16:00 WIB';
  });

  readonly workerFirstName = computed(() => {
    const name = this.workerProfile()?.name || 'Sarah Melinda';
    return name.split(' ')[0];
  });

  readonly tanyaWorkerWhatsAppUrl = computed(() => {
    const profile = this.workerProfile();
    const phone = profile?.whatsapp_number || '6281288992211';
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Halo ${profile?.name || 'Pekerja'}, saya ingin konsultasi mengenai layanan pemesanan mandiri Tuwaktu.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  });

  stepDuration(delta: number): void {
    const current = this.hourlyDuration();
    const next = Math.max(2.0, Math.min(8.0, current + delta));
    this.hourlyDuration.set(next);
    this.isDurationCustomized.set(true);
  }

  onFieldChange(field: keyof BookingFormDraft, value: string): void {
    let cleanVal = value;
    if (field === 'clientFullName') {
      cleanVal = cleanVal.slice(0, 100);
    } else if (field === 'serviceLocationAddress' || field === 'serviceOperationalZone') {
      cleanVal = cleanVal.slice(0, 255);
    } else if (field === 'clientEmailAddress') {
      cleanVal = cleanVal.slice(0, 100);
    } else if (field === 'additionalClientNotes') {
      cleanVal = cleanVal.slice(0, 500);
    }
    const updated = { ...this.formDraft(), [field]: cleanVal };
    this.formDraftChange.emit(updated);
    this.clearFieldError.emit(field);
  }

  onPhoneInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let sanitized = inputElement.value.replace(/[^0-9+]/g, '');
    if (sanitized.length > 16) {
      sanitized = sanitized.slice(0, 16);
    }
    inputElement.value = sanitized;
    this.onFieldChange('clientContactPhone', sanitized);
  }

  onCoordinatesSelected(coords: { lat: number; lng: number }): void {
    this.clientCoordinatesChange.emit(coords);
  }

  onDatePickerChange(dateStr: string): void {
    this.dateChange.emit(dateStr);
  }

  selectDateOption(dateStr: string): void {
    this.onDatePickerChange(dateStr);
  }

  onSelectService(serviceItem: PublicServiceCatalogItem): void {
    this.serviceSelect.emit(serviceItem);
  }

  formatServicePriceTag(serviceItem: PublicServiceCatalogItem): string {
    const rate = serviceItem.base_price || serviceItem.price;
    const isUnit = (serviceItem.rate_type || '').toUpperCase() === 'UNIT';
    return `${this.formatCurrency(rate)} / ${isUnit ? 'sesi' : 'jam'}`;
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

  getEstimatedEndTime(slot: AvailableTimeSlot): string {
    if (!slot.start_time) return slot.end_time || '15:30';
    const parts = slot.start_time.split(':');
    if (parts.length < 2) return slot.end_time || '15:30';
    const startHour = parseInt(parts[0], 10);
    const startMin = parseInt(parts[1], 10);
    const durationMin = Math.round(this.hourlyDuration() * 60);
    const totalMin = startHour * 60 + startMin + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDateIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDayName(dayIndex: number): string {
    const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return names[dayIndex] || 'Hari';
  }

  private getMonthName(monthIndex: number): string {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return months[monthIndex] || '';
  }
}
