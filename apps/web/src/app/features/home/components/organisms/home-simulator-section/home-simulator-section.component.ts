import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-simulator-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Dark Nocturne Section for Financial Calculation -->
    <section
      id="kalkulator-hemat"
      class="w-full bg-hero-canvas text-ink-on-dark py-space-3xl sm:py-space-4xl border-b border-white/10"
      aria-labelledby="simulator-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="max-w-3xl space-y-space-xs">
          <div class="flex items-center gap-space-xs">
            <span
              class="px-2 py-0.5 rounded bg-white/10 text-voltage-orange font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
            >
              Kalkulator Kedaulatan Finansial
            </span>
          </div>

          <h2
            id="simulator-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-white tracking-tight"
          >
            Hitung Uang yang Anda Hemat Tanpa Komisi
          </h2>

          <p class="font-body-default text-body-default text-white/70 leading-relaxed">
            Geser estimasi omzet kotor bulanan Anda. Lihat berapa juta rupiah yang terselamatkan dari potongan 20%-30% aplikasi konvensional.
          </p>
        </div>

        <!-- Interactive Simulator Card Container -->
        <div
          class="p-space-xl sm:p-space-2xl bg-surface-elevated-dark/90 rounded-2xl border border-white/15 shadow-2xl max-w-5xl"
        >
          <div class="space-y-space-2xl">
            <!-- Slider Control -->
            <div class="space-y-space-md">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <label
                  for="omzetRangeSlider"
                  class="font-body-strong text-body-strong text-white"
                >
                  Perkiraan Pendapatan / Omzet Kotor per Bulan:
                </label>
                <span
                  id="currentOmzetDisplay"
                  class="font-mono-rate text-[24px] sm:text-[28px] font-bold text-voltage-orange"
                >
                  {{ formattedOmzet() }}
                </span>
              </div>

              <div class="space-y-2">
                <input
                  id="omzetRangeSlider"
                  type="range"
                  min="3000000"
                  max="25000000"
                  step="500000"
                  [ngModel]="omzetInput()"
                  (ngModelChange)="onOmzetChange($event)"
                  class="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-voltage-orange"
                  aria-label="Slider estimasi omzet kotor per bulan"
                />

                <div class="flex justify-between text-caption font-mono-rate text-white/40">
                  <span>Rp 3.000.000</span>
                  <span>Rp 14.000.000</span>
                  <span>Rp 25.000.000</span>
                </div>
              </div>
            </div>

            <!-- Comparison Metric Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg pt-space-md border-t border-white/10">
              <!-- Potongan Aplikasi Lain (25%) -->
              <div class="p-space-lg rounded-xl bg-white/5 border border-white/10 space-y-space-xs">
                <span class="font-micro-uppercase text-caption text-white/50 uppercase">
                  Aplikasi Konvensional (25%)
                </span>
                <p id="gigCommissionDisplay" class="font-mono-rate text-heading-h2 font-bold text-error">
                  - {{ formattedGigCommission() }}
                </p>
                <p class="font-caption text-white/60">
                  Terpotong otomatis setiap bulan oleh perantara.
                </p>
              </div>

              <!-- Tuwaktu 0% Komisi -->
              <div class="p-space-lg rounded-xl bg-white/5 border border-white/10 space-y-space-xs">
                <span class="font-micro-uppercase text-caption text-white/50 uppercase">
                  Tuwaktu Mandiri (0%)
                </span>
                <p class="font-mono-rate text-heading-h2 font-bold text-white">
                  Rp 0 Potongan
                </p>
                <p class="font-caption text-white/60">
                  100% dari klien langsung ke rekening atau tunai Anda.
                </p>
              </div>

              <!-- Uang yang Dihemat (Highlight Green) -->
              <div
                class="p-space-lg rounded-xl bg-success/10 border border-success/30 space-y-space-xs relative overflow-hidden"
              >
                <span class="font-micro-uppercase text-caption text-success font-bold uppercase">
                  Uang Utuh yang Anda Hemat
                </span>
                <p id="monthlySavingsDisplay" class="font-mono-rate text-heading-h2 font-bold text-success">
                  + {{ formattedMonthlySavings() }}
                  <span class="text-caption font-normal text-white/70">/ bulan</span>
                </p>
                <p id="annualSavingsDisplay" class="font-caption font-mono-rate text-success font-semibold">
                  Setara + {{ formattedAnnualSavings() }} / tahun
                </p>
              </div>
            </div>

            <!-- Bottom CTA Button -->
            <div
              class="pt-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-t border-white/10"
            >
              <div class="space-y-0.5">
                <p class="font-body-strong text-body-strong text-white">
                  Siap memiliki sistem reservasi mandiri Anda sendiri?
                </p>
                <p class="font-caption text-white/60">
                  Daftar profil pekerja gratis, tentukan radius operasional, dan bagikan tautan portofolio Anda.
                </p>
              </div>

              <a
                routerLink="/register"
                class="m3-btn-whatsapp text-body-default font-bold whitespace-nowrap px-space-xl min-h-[48px] self-start sm:self-auto"
              >
                Daftar Sebagai Pekerja Mandiri (Gratis 0%)
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSimulatorSectionComponent {
  readonly omzetInput = signal<number>(8000000);

  readonly gigAppCommission = computed(() => {
    return Math.round(this.omzetInput() * 0.25);
  });

  readonly tuwaktuDeduction = computed(() => 0);

  readonly monthlySavings = computed(() => {
    return this.gigAppCommission();
  });

  readonly annualSavings = computed(() => {
    return this.gigAppCommission() * 12;
  });

  readonly formattedOmzet = computed(() => {
    return this.formatCurrency(this.omzetInput());
  });

  readonly formattedGigCommission = computed(() => {
    return this.formatCurrency(this.gigAppCommission());
  });

  readonly formattedMonthlySavings = computed(() => {
    return this.formatCurrency(this.monthlySavings());
  });

  readonly formattedAnnualSavings = computed(() => {
    return this.formatCurrency(this.annualSavings());
  });

  onOmzetChange(value: number | string): void {
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!isNaN(numeric) && numeric >= 0) {
      this.omzetInput.set(numeric);
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
