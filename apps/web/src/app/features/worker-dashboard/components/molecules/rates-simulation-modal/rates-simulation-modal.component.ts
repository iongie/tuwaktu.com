import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rates-simulation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulationModalTitle"
    >
      <button
        type="button"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default w-full h-full border-0"
        (click)="dismissModal.emit()"
        aria-label="Tutup Latar Belakang Modal"
      ></button>

      <div
        class="relative z-10 bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-hairline-subtle"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-hairline-subtle">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-2xl">calculate</span>
            </div>
            <div>
              <h3 id="simulationModalTitle" class="font-heading-3 text-heading-3 text-on-surface font-bold">
                Simulasi Pendapatan Mandiri
              </h3>
              <p class="text-caption font-caption text-ink-secondary">
                Bandingkan pendapatan bersih 100% Anda di Tuwaktu vs potongan komisi platform lain.
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="p-2 text-ink-secondary hover:text-primary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup Simulasi"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Simulation Controls -->
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs font-bold text-on-surface">
              <label for="weeklyHoursRange" class="cursor-pointer">Alokasi Jam Kerja per Minggu</label>
              <span class="font-mono text-voltage-orange">{{ weeklyHours() }} Jam / Minggu</span>
            </div>
            <input
              id="weeklyHoursRange"
              type="range"
              min="5"
              max="50"
              step="1"
              [ngModel]="weeklyHours()"
              (ngModelChange)="weeklyHours.set($event)"
              class="w-full accent-voltage-orange cursor-pointer"
            />
          </div>

          <div class="space-y-2">
            <label for="hourlyRateInput" class="block text-xs font-bold text-on-surface">
              Estimasi Tarif Rata-rata per Jam (Rp)
            </label>
            <input
              id="hourlyRateInput"
              type="number"
              min="20000"
              step="5000"
              [ngModel]="hourlyRate()"
              (ngModelChange)="hourlyRate.set($event)"
              class="w-full px-3.5 py-2.5 bg-surface-container-low border border-hairline-light rounded-lg text-sm font-mono text-on-surface min-h-[44px]"
            />
          </div>
        </div>

        <!-- Comparison Breakdown Bento Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <!-- Tuwaktu 0% Cut Card -->
          <div class="p-4 rounded-xl bg-success-surface border border-success/30 space-y-1">
            <div class="flex items-center gap-1.5 text-micro-uppercase font-micro-uppercase text-success font-bold">
              <span class="material-symbols-outlined text-[16px]">verified</span>
              <span>TUWAKTU (0% POTONGAN)</span>
            </div>
            <div class="font-heading-2 text-heading-2 text-primary font-bold">
              {{ formattedTuwaktuMonthly() }}
            </div>
            <p class="text-caption font-caption text-ink-secondary">
              100% utuh masuk ke kantong Anda setiap bulan.
            </p>
          </div>

          <!-- Other Platforms 25% Cut Card -->
          <div class="p-4 rounded-xl bg-error-surface border border-error/30 space-y-1">
            <div class="flex items-center gap-1.5 text-micro-uppercase font-micro-uppercase text-error font-bold">
              <span class="material-symbols-outlined text-[16px]">money_off</span>
              <span>PLATFORM LAIN (-25%)</span>
            </div>
            <div class="font-heading-2 text-heading-2 text-on-surface-variant font-bold">
              {{ formattedOtherMonthly() }}
            </div>
            <p class="text-caption font-caption text-error font-semibold">
              Potongan komisi: {{ formattedLostCommission() }}/bln
            </p>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="pt-2 flex justify-end">
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-button-label text-button-label hover:bg-neutral-800 transition-colors min-h-[44px] cursor-pointer"
          >
            Tutup Simulasi
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesSimulationModalComponent {
  readonly dismissModal = output<void>();

  readonly weeklyHours = signal<number>(20);
  readonly hourlyRate = signal<number>(75000);

  readonly monthlyTuwaktuEarnings = computed(() => {
    const hours = Math.max(0, Number(this.weeklyHours()) || 0);
    const rate = Math.max(0, Number(this.hourlyRate()) || 0);
    return hours * rate * 4.2;
  });

  readonly monthlyOtherEarnings = computed(() => {
    return this.monthlyTuwaktuEarnings() * 0.75;
  });

  readonly lostMonthlyCommission = computed(() => {
    return this.monthlyTuwaktuEarnings() * 0.25;
  });

  readonly formattedTuwaktuMonthly = computed(() => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(this.monthlyTuwaktuEarnings());
  });

  readonly formattedOtherMonthly = computed(() => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(this.monthlyOtherEarnings());
  });

  readonly formattedLostCommission = computed(() => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(this.lostMonthlyCommission());
  });
}
