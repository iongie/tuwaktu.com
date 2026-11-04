import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SimulatorLocationPreset {
  readonly distanceKm: number;
  readonly address: string;
  readonly label: string;
}

@Component({
  selector: 'app-logistics-simulator-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col gap-5 border border-hairline-subtle">
      <!-- Title & Test Runner Badge -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">calculate</span>
          <h2 class="font-heading-3 text-heading-3 text-primary font-semibold">Simulator Jarak &amp; Cek Ongkos</h2>
        </div>
        <span class="inline-block px-2.5 py-1 rounded bg-surface-highlight text-micro-uppercase font-micro-uppercase text-ink-secondary font-bold">
          TEST RUNNER
        </span>
      </div>

      <p class="font-caption text-caption text-ink-secondary">
        Uji coba kalkulasi logistik sebelum diterapkan ke laman pemesanan umum klien.
      </p>

      <!-- Test Presets & Input -->
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="font-caption text-caption text-primary font-semibold" for="sim-select-preset">
            Pilih Contoh Lokasi Klien:
          </label>
          <select
            id="sim-select-preset"
            [ngModel]="selectedPresetValue()"
            (ngModelChange)="onPresetChanged($event)"
            class="w-full h-11 px-3 bg-surface-highlight rounded-lg font-body-default text-body-default text-primary border border-hairline-subtle focus:outline-hidden focus:bg-surface-container-lowest shadow-2xs min-h-[44px] cursor-pointer"
          >
            @for (preset of presets; track preset.address) {
              <option [value]="preset.distanceKm + '|' + preset.address">
                {{ preset.label }}
              </option>
            }
          </select>
        </div>

        <!-- Custom Manual Distance Input -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-surface-highlight border border-hairline-subtle">
          <div class="flex flex-col">
            <span class="font-caption text-caption text-primary font-semibold">
              Kustom Jarak Titik Jemput
            </span>
            <span class="text-[11px] font-mono text-ink-secondary">
              Uji jarak spesifik di luar daftar preset
            </span>
          </div>
          <div class="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-hairline-subtle shadow-2xs">
            <input
              id="sim-custom-distance-input"
              type="number"
              min="0.5"
              max="35"
              step="0.1"
              [ngModel]="simulatedDistanceKm()"
              (ngModelChange)="onCustomDistanceChanged($event)"
              class="w-14 bg-transparent text-right font-mono-rate text-mono-rate text-primary font-bold focus:outline-hidden"
              aria-label="Jarak simulasi kilometer"
            />
            <span class="font-mono-rate text-caption text-ink-secondary font-semibold">Km</span>
          </div>
        </div>

        <!-- Dynamic Output Terminal Card -->
        <div class="bg-surface-highlight rounded-xl p-5 flex flex-col gap-4 border border-hairline-subtle">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-caption text-caption text-ink-secondary font-medium">Status Kelayakan Reservasi:</span>
            <span
              id="sim-status-badge"
              class="px-3 py-1 rounded-full font-mono-rate text-caption font-bold"
              [class]="statusBadgeClasses()"
            >
              {{ statusBadgeText() }}
            </span>
          </div>

          <!-- Ledger Breakdown -->
          <div class="flex flex-col gap-2 py-1 text-body-default">
            <div class="flex justify-between text-on-surface-variant">
              <span>Jarak Terhitung dari {{ basecampZone() }}</span>
              <span class="font-mono-rate font-bold text-primary">
                {{ simulatedDistanceKm() | number:'1.1-1' }} Km
              </span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
              <span>Radius Gratis Tercover</span>
              <span class="font-mono-rate text-success font-semibold">
                - {{ freeRadiusKm() | number:'1.1-1' }} Km
              </span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
              <span>Kilometer Tertagih</span>
              <span
                class="font-mono-rate font-semibold"
                [class.text-error]="isRejected()"
                [class.text-success]="isFreeZone()"
                [class.text-primary]="!isRejected() && !isFreeZone()"
              >
                @if (isRejected()) {
                  Nonaktif (Melebihi {{ maxRadiusKm() | number:'1.1-1' }} km)
                } @else if (isFreeZone()) {
                  0.0 Km (Termasuk)
                } @else {
                  {{ billableKm() | number:'1.1-1' }} Km
                }
              </span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
              <span>Tarif Berlaku</span>
              <span class="font-mono-rate text-ink-secondary">
                @ Rp {{ formattedRatePerKm() }} / km
              </span>
            </div>
          </div>

          <div class="h-px bg-hairline-subtle"></div>

          <!-- Total Result -->
          <div class="flex items-end justify-between flex-wrap gap-2">
            <div class="flex flex-col">
              <span class="font-caption text-caption text-ink-secondary">Tambahan Ongkos Logistik:</span>
              <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold">
                DITAMBAHKAN OTOMATIS KE INVOICE
              </span>
            </div>
            <span
              id="sim-calc-total"
              class="font-heading-2 text-heading-2 font-bold font-mono-rate"
              [class.text-error]="isRejected()"
              [class.text-success]="isFreeZone()"
              [class.text-primary]="!isRejected() && !isFreeZone()"
            >
              @if (isRejected()) {
                Ditolak Otomatis
              } @else if (isFreeZone()) {
                Rp 0
              } @else {
                + Rp {{ formattedExtraFeeTotal() }}
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LogisticsSimulatorTerminalComponent {
  readonly freeRadiusKm = input<number>(3.0);
  readonly maxRadiusKm = input<number>(5.0);
  readonly extraFeePerKm = input<number>(3000);
  readonly basecampZone = input<string>('Tebet');

  readonly simulatedDistanceKm = signal<number>(4.2);
  readonly simulatedAddress = signal<string>('Jl. Senopati No. 42, Kebayoran Baru');
  readonly selectedPresetValue = signal<string>('4.2|Jl. Senopati No. 42, Kebayoran Baru');

  readonly presets: readonly SimulatorLocationPreset[] = [
    {
      distanceKm: 1.8,
      address: 'Jl. Tebet Barat Dalam VI',
      label: 'Tebet Barat (1.8 km) • Dekat Basecamp',
    },
    {
      distanceKm: 3.0,
      address: 'Stasiun Manggarai',
      label: 'Stasiun Manggarai (3.0 km) • Persis Batas Gratis',
    },
    {
      distanceKm: 4.2,
      address: 'Jl. Senopati No. 42, Kebayoran Baru',
      label: 'Kebayoran Baru / Senopati (4.2 km) • Zona Tambahan',
    },
    {
      distanceKm: 6.5,
      address: 'Jl. Kemang Raya No. 10',
      label: 'Kemang Raya (6.5 km) • Melampaui Batas Maksimal',
    },
  ];

  readonly isRejected = computed(() => {
    return this.simulatedDistanceKm() > this.maxRadiusKm();
  });

  readonly isFreeZone = computed(() => {
    return this.simulatedDistanceKm() <= this.freeRadiusKm();
  });

  readonly billableKm = computed(() => {
    if (this.isRejected() || this.isFreeZone()) {
      return 0;
    }
    const raw = this.simulatedDistanceKm() - this.freeRadiusKm();
    return Math.round(raw * 10) / 10;
  });

  readonly extraFeeTotal = computed(() => {
    if (this.isRejected() || this.isFreeZone()) {
      return 0;
    }
    return Math.round(this.billableKm() * this.extraFeePerKm());
  });

  readonly formattedRatePerKm = computed(() => {
    return new Intl.NumberFormat('id-ID').format(this.extraFeePerKm());
  });

  readonly formattedExtraFeeTotal = computed(() => {
    return new Intl.NumberFormat('id-ID').format(this.extraFeeTotal());
  });

  readonly statusBadgeText = computed(() => {
    if (this.isRejected()) {
      return 'PESANAN DITOLAK (LUAR RADIUS)';
    }
    if (this.isFreeZone()) {
      return 'BEBAS ONGKOS BENSIN';
    }
    return 'DISETUJUI DENGAN SURCHARGE';
  });

  readonly statusBadgeClasses = computed(() => {
    if (this.isRejected()) {
      return 'bg-error-surface text-error-dark border border-error/20';
    }
    if (this.isFreeZone()) {
      return 'bg-success-surface text-success border border-success/20';
    }
    return 'bg-warning-surface text-promo-ink border border-warning/20';
  });

  onPresetChanged(rawVal: string): void {
    if (!rawVal) return;
    this.selectedPresetValue.set(rawVal);
    const [distStr, address] = rawVal.split('|');
    const dist = parseFloat(distStr);
    if (!Number.isNaN(dist)) {
      this.simulatedDistanceKm.set(dist);
    }
    if (address) {
      this.simulatedAddress.set(address);
    }
  }

  onCustomDistanceChanged(rawVal: unknown): void {
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val >= 0) {
      this.simulatedDistanceKm.set(val);
      const match = this.presets.find((p) => p.distanceKm === val);
      if (match) {
        this.selectedPresetValue.set(`${match.distanceKm}|${match.address}`);
      } else {
        this.selectedPresetValue.set('');
      }
    }
  }
}
