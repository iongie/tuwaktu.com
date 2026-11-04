import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-worker-logistics-config-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col gap-6 border border-hairline-subtle">
      <!-- Header -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">tune</span>
          <h2 class="font-heading-3 text-heading-3 text-primary font-semibold">
            Parameter Formula Ongkos &amp; Batas Fisik
          </h2>
        </div>
        <p class="font-caption text-caption text-ink-secondary">
          Sistem secara otomatis menerapkan kalkulasi ini saat klien memilih alamat penjemputan/lokasi jasa.
        </p>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Parameter 1: Radius Bebas Ongkir -->
        <div class="flex flex-col gap-4 p-5 bg-surface-highlight rounded-xl border border-hairline-subtle">
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-success"></span>
                <span class="font-body-strong text-body-strong text-primary">
                  Radius Bebas Ongkir (Included in Service)
                </span>
              </div>
              <span class="font-caption text-caption text-ink-secondary mt-1">
                Semua pesanan di dalam lingkar ini tidak dikenakan biaya jalan tambahan.
              </span>
            </div>
            <div class="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-hairline-subtle shadow-2xs">
              <input
                id="input-free-km"
                type="number"
                min="0.5"
                max="15"
                step="0.5"
                [ngModel]="freeRadiusKm()"
                (ngModelChange)="onFreeRadiusInput($event)"
                class="w-14 bg-transparent text-right font-mono-rate text-mono-rate text-primary font-bold focus:outline-hidden"
                aria-label="Radius bebas ongkir kilometer"
              />
              <span class="font-mono-rate text-mono-rate text-ink-secondary font-semibold">Km</span>
            </div>
          </div>

          <!-- Slider Control -->
          <div class="flex flex-col gap-1.5">
            <input
              id="slider-free-km"
              type="range"
              min="1"
              max="10"
              step="0.5"
              [ngModel]="freeRadiusKm()"
              (ngModelChange)="onFreeRadiusInput($event)"
              class="w-full accent-primary h-2 bg-surface-container-highest rounded-lg cursor-pointer transition-all"
              aria-label="Slider radius bebas ongkir"
            />
            <div class="flex justify-between font-mono-rate text-caption text-ink-secondary px-0.5">
              <span>1.0 Km</span>
              <span>Rekomendasi Jabodetabek: 3.0 Km</span>
              <span>10.0 Km</span>
            </div>
          </div>
        </div>

        <!-- Parameter 2: Biaya Tambahan Per Km -->
        <div class="flex flex-col gap-4 p-5 bg-surface-highlight rounded-xl border border-hairline-subtle">
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-warning"></span>
                <span class="font-body-strong text-body-strong text-primary">
                  Biaya Tambahan Per Kilometer
                </span>
              </div>
              <span class="font-caption text-caption text-ink-secondary mt-1">
                Tarif pengganti bensin &amp; waktu tempuh untuk setiap km di atas batas radius gratis.
              </span>
            </div>
            <div class="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-hairline-subtle shadow-2xs">
              <span class="font-mono-rate text-caption text-ink-secondary font-bold">Rp</span>
              <input
                id="input-rate-km"
                type="number"
                min="0"
                max="25000"
                step="500"
                [ngModel]="extraFeePerKm()"
                (ngModelChange)="onExtraFeeInput($event)"
                class="w-20 bg-transparent text-right font-mono-rate text-mono-rate text-primary font-bold focus:outline-hidden"
                aria-label="Tarif per kilometer"
              />
              <span class="font-mono-rate text-caption text-ink-secondary">/ km</span>
            </div>
          </div>

          <!-- Contextual Breakdown Note -->
          <div class="flex items-center gap-2 text-caption text-on-surface-variant bg-surface-container-lowest/80 p-2.5 rounded-lg border border-hairline-subtle">
            <span class="material-symbols-outlined text-[16px] text-ink-secondary shrink-0">info</span>
            <span>Kalkulasi transparan tercantum jelas di rincian bukti pesanan sebelum klien konfirmasi ke WhatsApp.</span>
          </div>
        </div>

        <!-- Parameter 3: Batas Jangkauan Maksimal -->
        <div class="flex flex-col gap-4 p-5 bg-error-surface/40 rounded-xl border border-error/20">
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span class="font-body-strong text-body-strong text-error-dark">
                  Batas Jangkauan Maksimal (Hard Cap Auto-Reject)
                </span>
              </div>
              <span class="font-caption text-caption text-error-dark/80 mt-1">
                Order di luar jarak ini diblokir secara otomatis oleh sistem reservasi publik.
              </span>
            </div>
            <div class="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-error/30 shadow-2xs">
              <input
                id="input-max-km"
                type="number"
                min="2"
                max="30"
                step="0.5"
                [ngModel]="maxRadiusKm()"
                (ngModelChange)="onMaxRadiusInput($event)"
                class="w-14 bg-transparent text-right font-mono-rate text-mono-rate text-error-dark font-bold focus:outline-hidden"
                aria-label="Batas jangkauan maksimal kilometer"
              />
              <span class="font-mono-rate text-mono-rate text-error-dark font-semibold">Km</span>
            </div>
          </div>

          <!-- Slider Control -->
          <div class="flex flex-col gap-1.5">
            <input
              id="slider-max-km"
              type="range"
              min="3"
              max="20"
              step="0.5"
              [ngModel]="maxRadiusKm()"
              (ngModelChange)="onMaxRadiusInput($event)"
              class="w-full accent-error h-2 bg-surface-container-highest rounded-lg cursor-pointer transition-all"
              aria-label="Slider batas jangkauan maksimal"
            />
            <div class="flex justify-between font-mono-rate text-caption text-error-dark/70 px-0.5">
              <span>3.0 Km</span>
              <span>Standar Proteksi Kelelahan: 5.0 Km</span>
              <span>20.0 Km</span>
            </div>
          </div>

          <!-- Auto-Reject Warning Banner -->
          <div class="flex items-center gap-2 text-caption text-error-dark bg-surface-container-lowest p-3 rounded-lg border border-error/20 shadow-2xs">
            <span class="material-symbols-outlined text-[18px] text-error shrink-0">gpp_bad</span>
            <span class="font-caption font-semibold">
              Auto-Reject: Sistem tidak akan menampilkan slot kosong jika klien terdeteksi berada &gt; {{ maxRadiusKm() | number:'1.1-1' }} km dari {{ basecampZone() }}.
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WorkerLogisticsConfigPanelComponent {
  readonly freeRadiusKm = input<number>(3.0);
  readonly extraFeePerKm = input<number>(3000);
  readonly maxRadiusKm = input<number>(5.0);
  readonly basecampZone = input<string>('Tebet');

  readonly freeRadiusKmChange = output<number>();
  readonly extraFeePerKmChange = output<number>();
  readonly maxRadiusKmChange = output<number>();

  onFreeRadiusInput(rawVal: unknown): void {
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val >= 0) {
      this.freeRadiusKmChange.emit(val);
      if (val > this.maxRadiusKm()) {
        this.maxRadiusKmChange.emit(val);
      }
    }
  }

  onExtraFeeInput(rawVal: unknown): void {
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val >= 0) {
      this.extraFeePerKmChange.emit(val);
    }
  }

  onMaxRadiusInput(rawVal: unknown): void {
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val > 0) {
      this.maxRadiusKmChange.emit(val);
      if (val < this.freeRadiusKm()) {
        this.freeRadiusKmChange.emit(val);
      }
    }
  }
}
