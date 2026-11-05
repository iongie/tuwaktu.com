import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-workflow-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="alur-pemesanan"
      class="w-full bg-surface-container-low py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="workflow-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto space-y-space-xs">
          <span
            class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider inline-block"
          >
            Alur Pemesanan
          </span>

          <h2
            id="workflow-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Reservasi Cerdas dalam 3 Langkah
          </h2>

          <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
            Tanpa repot membuat akun baru, tanpa deposit saldo tersandera, dan tanpa biaya perantara tambahan.
          </p>
        </div>

        <!-- 3 Process Step Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-xl relative">
          @for (step of steps; track step.stepNumber) {
            <div
              class="m3-card-surface p-space-xl bg-body-canvas border border-hairline-subtle rounded-2xl flex flex-col justify-between relative group hover:border-hero-canvas transition-colors"
            >
              <div class="space-y-space-md">
                <!-- Step Badge & Icon -->
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono-rate font-bold text-heading-h3 text-voltage-orange"
                  >
                    0{{ step.stepNumber }}
                  </span>
                  <div
                    class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface group-hover:bg-hero-canvas group-hover:text-white transition-colors"
                  >
                    <span class="material-symbols-outlined text-[24px]">
                      {{ step.icon }}
                    </span>
                  </div>
                </div>

                <!-- Step Title & Description -->
                <div>
                  <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
                    {{ step.title }}
                  </h3>
                  <p class="font-body-default text-body-default text-ink-secondary mt-2 leading-relaxed">
                    {{ step.description }}
                  </p>
                </div>
              </div>

              <!-- Footer Tip -->
              <div class="mt-space-lg pt-space-md border-t border-hairline-subtle text-caption text-ink-secondary font-mono-rate">
                {{ step.tip }}
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeWorkflowSectionComponent {
  readonly steps = [
    {
      stepNumber: 1,
      title: 'Pilih Spesialis & Kunci Slot Waktu',
      description:
        'Cari mitra berdasarkan zona pangkalan. Pilih layanan katalog dan tentukan slot jam kedatangan yang bebas bentrok buffer transit.',
      icon: 'calendar_month',
      tip: 'Jeda 60-90m otomatis mengamankan perjalanan mitra.',
    },
    {
      stepNumber: 2,
      title: 'Tentukan Alamat & Hitung Jarak',
      description:
        'Isi lokasi pengerjaan. Sistem menghitung radius logistik secara akurat dengan batas gratis ongkir yang transparan.',
      icon: 'pin_drop',
      tip: 'Gratis biaya radius hingga jangkauan pangkalan.',
    },
    {
      stepNumber: 3,
      title: 'Kirim Format Pesanan ke WhatsApp',
      description:
        'Sistem menyusun draf reservasi berformat resmi. Klik satu tombol untuk membuka chat WhatsApp langsung ke nomor mitra.',
      icon: 'chat',
      tip: 'Kode booking tercatat rapi di sistem mandiri.',
    },
  ];
}
