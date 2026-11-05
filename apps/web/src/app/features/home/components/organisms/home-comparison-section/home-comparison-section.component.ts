import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonPoint } from '../../../models/home.model';

@Component({
  selector: 'app-home-comparison-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="manifesto-kedaulatan"
      class="w-full bg-body-canvas py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="comparison-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="max-w-3xl space-y-space-xs">
          <div class="flex items-center gap-space-xs">
            <span
              class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
            >
              Manifesto Kedaulatan Ekonomi
            </span>
          </div>

          <h2
            id="comparison-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Mengapa Memilih Protokol Mandiri Tuwaktu?
          </h2>

          <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
            Perbandingan jujur antara infrastruktur mandiri tanpa perantara dengan aplikasi on-demand konvensional yang memotong hasil kerja praktisi.
          </p>
        </div>

        <!-- Bento Comparison Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
          <!-- Card Tuwaktu Mandiri (Hero Spotlight) -->
          <div
            class="p-space-xl rounded-2xl bg-hero-canvas text-ink-on-dark space-y-space-lg border border-white/10 shadow-xl relative overflow-hidden"
          >
            <div
              class="flex items-center justify-between pb-space-md border-b border-white/10"
            >
              <div class="flex items-center gap-2">
                <span class="font-heading-h3 text-heading-h3 font-bold text-white uppercase tracking-tight">
                  Tuwaktu Mandiri
                </span>
                <span
                  class="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-mono-rate font-bold uppercase"
                >
                  Protokol Adil
                </span>
              </div>
              <span class="font-mono-rate text-voltage-orange font-bold text-caption">
                0% KOMISI
              </span>
            </div>

            <div class="space-y-space-md">
              @for (point of comparisonList; track point.id) {
                <div class="flex items-start gap-space-sm">
                  <span
                    class="material-symbols-outlined text-[20px] text-success shrink-0 mt-0.5"
                  >
                    check_circle
                  </span>
                  <div class="space-y-0.5">
                    <p class="font-body-strong text-body-strong text-white">
                      {{ point.feature }}: {{ point.tuwaktuProtocol }}
                    </p>
                    <p class="font-caption text-caption text-white/60">
                      {{ point.advantageDescription }}
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Card Aplikasi Gig Konvensional (Contrast) -->
          <div
            class="p-space-xl rounded-2xl bg-surface-container-low text-on-surface space-y-space-lg border border-hairline-subtle"
          >
            <div
              class="flex items-center justify-between pb-space-md border-b border-hairline-subtle"
            >
              <div class="flex items-center gap-2">
                <span class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
                  Aplikasi Gig Konvensional
                </span>
              </div>
              <span class="font-mono-rate text-error font-bold text-caption">
                POTONGAN 20% - 30%
              </span>
            </div>

            <div class="space-y-space-md">
              @for (point of comparisonList; track point.id) {
                <div class="flex items-start gap-space-sm opacity-85">
                  <span
                    class="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5"
                  >
                    cancel
                  </span>
                  <div class="space-y-0.5">
                    <p class="font-body-strong text-body-strong text-on-surface">
                      {{ point.feature }}: {{ point.gigPlatform }}
                    </p>
                    <p class="font-caption text-caption text-ink-secondary">
                      Hasil jerih payah terpotong oleh perantara tanpa kebebasan mengatur jam kerja mandiri.
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComparisonSectionComponent {
  readonly comparisonList: ComparisonPoint[] = [
    {
      id: 'point-1',
      feature: 'Biaya Komisi',
      tuwaktuProtocol: '0% Potongan Jasa',
      gigPlatform: 'Potongan 20% - 30% dari omzet',
      advantageDescription: 'Seluruh pembayaran dari klien 100% menjadi hak bersih mitra.',
    },
    {
      id: 'point-2',
      feature: 'Kepemilikan Kontak',
      tuwaktuProtocol: 'WhatsApp Asli Langsung',
      gigPlatform: 'Nomor virtual disamarkan',
      advantageDescription: 'Klien menjadi aset pelanggan tetap untuk pemesanan rutin di masa depan.',
    },
    {
      id: 'point-3',
      feature: 'Jeda Transit Perjalanan',
      tuwaktuProtocol: 'Buffer 60 - 90 Menit Terkunci',
      gigPlatform: 'Order ditumpuk tanpa jeda jalan',
      advantageDescription: 'Waktu istirahat cukup dan mitigasi keterlambatan akibat kemacetan lalu lintas.',
    },
    {
      id: 'point-4',
      feature: 'Penentuan Tarif',
      tuwaktuProtocol: 'Tarif Mandiri Pekerja',
      gigPlatform: 'Harga sepihak oleh algoritma',
      advantageDescription: 'Mitra menentukan tarif wajar sesuai kualitas pengerjaan dan alat profesional.',
    },
    {
      id: 'point-5',
      feature: 'Portofolio Publik',
      tuwaktuProtocol: 'Domain & Halaman Slug Personal',
      gigPlatform: 'Profil tertutup di aplikasi',
      advantageDescription: 'Tautan profil mandiri (/:slug) dapat dibagikan bebas ke status medsos dan kartu nama.',
    },
  ];
}
