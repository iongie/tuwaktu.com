import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ServiceCommitment {
  id: string;
  icon: string;
  title: string;
  badge: string;
  description: string;
  keyPoint: string;
}

@Component({
  selector: 'app-home-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="standar-layanan"
      class="w-full bg-body-canvas py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="commitments-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="max-w-2xl space-y-space-xs">
          <div class="flex items-center gap-space-xs">
            <span
              class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
            >
              Komitmen Layanan
            </span>
          </div>

          <h2
            id="commitments-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Standar &amp; Komitmen Kerja Mitra Mandiri
          </h2>

          <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
            Prinsip transparansi dan keandalan kerja yang dipegang teguh oleh setiap mitra teknisi independen di Tuwaktu.
          </p>
        </div>

        <!-- 3-Column Commitment Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          @for (item of commitments; track item.id) {
            <article
              class="m3-card-outlined p-space-xl bg-body-canvas flex flex-col justify-between h-full space-y-space-md hover:border-hero-canvas transition-colors"
            >
              <div class="space-y-space-sm">
                <!-- Icon & Badge Header -->
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-voltage-orange">
                    <span class="material-symbols-outlined text-[24px]">{{ item.icon }}</span>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase font-bold uppercase"
                  >
                    {{ item.badge }}
                  </span>
                </div>

                <!-- Commitment Title & Description -->
                <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface pt-2">
                  {{ item.title }}
                </h3>

                <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
                  {{ item.description }}
                </p>
              </div>

              <!-- Key Takeaway Footnote -->
              <div class="pt-space-md border-t border-hairline-subtle flex items-center gap-2 text-caption font-mono-rate text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px] text-success">check_circle</span>
                <span>{{ item.keyPoint }}</span>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeTestimonialsSectionComponent {
  readonly commitments: ServiceCommitment[] = [
    {
      id: 'commit-1',
      icon: 'payments',
      title: 'Tarif Pasti Tanpa Markup Perantara',
      badge: 'Bebas Potongan',
      description:
        'Biaya jasa dan ongkos jangkauan radius disepakati langsung sesuai katalog terbuka teknisi. Pembayaran 100% diterima langsung oleh mitra tanpa potongan komisi aplikasi.',
      keyPoint: 'Harga transparan tanpa biaya tersembunyi',
    },
    {
      id: 'commit-2',
      icon: 'schedule',
      title: 'Jeda Transit 60-90 Menit Antar Pesanan',
      badge: 'Jadwal Terlindungi',
      description:
        'Sistem otomatis mengunci jeda waktu perjalanan antar lokasi pengerjaan agar teknisi tiba sesuai slot reservasi dan dapat bekerja dengan cermat tanpa terburu-buru.',
      keyPoint: 'Mitigasi risiko bentrok dan keterlambatan',
    },
    {
      id: 'commit-3',
      icon: 'chat',
      title: 'Komunikasi Terbuka Langsung via WhatsApp',
      badge: 'Kontak Mandiri',
      description:
        'Rincian pesanan dan koordinasi pengerjaan langsung terhubung ke nomor WhatsApp asli teknisi. Tanpa sistem nomor virtual disamarkan atau penahanan dompet escrow.',
      keyPoint: 'Pelanggan menjadi relasi langsung mitra',
    },
  ];
}
