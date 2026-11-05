import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeWorkerCardComponent } from '../../molecules/home-worker-card/home-worker-card.component';
import { FeaturedWorker } from '../../../models/home.model';

@Component({
  selector: 'app-home-featured-workers-section',
  standalone: true,
  imports: [CommonModule, HomeWorkerCardComponent],
  template: `
    <section
      id="spesialis-unggulan"
      class="w-full bg-surface-container-low py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="featured-workers-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div class="max-w-2xl space-y-space-xs">
            <div class="flex items-center gap-space-xs">
              <span
                class="px-2 py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
              >
                Pilihan Minggu Ini
              </span>
            </div>

            <h2
              id="featured-workers-heading"
              class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
            >
              Teknisi Terverifikasi Siaga Jabodetabek
            </h2>

            <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
              Pilih mitra mandiri, periksa slot ketersediaan waktu yang terlindungi buffer transit, dan kirimkan konfirmasi langsung ke nomor WhatsApp mitra.
            </p>
          </div>

          <div class="text-caption font-mono-rate text-ink-disabled shrink-0">
            TOTAL 89+ PEKERJA AKTIF
          </div>
        </div>

        <!-- 4-Column Grid of Worker Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
          @for (worker of featuredWorkers; track worker.id) {
            <app-home-worker-card [worker]="worker" />
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFeaturedWorkersSectionComponent {
  readonly featuredWorkers: FeaturedWorker[] = [
    {
      id: 'worker-sarah',
      slug: 'sarah-cleaning',
      name: 'Sarah Melinda',
      specialty: 'Spesialis Sanitasi & Deep Clean',
      category: 'Sanitasi',
      rating: 4.9,
      reviewCount: 48,
      basecampZone: 'Tebet, Jakarta Selatan',
      startingPrice: 65000,
      priceUnit: 'jam',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      isVerified: true,
      specialtyTags: ['Deep Clean', 'Sterilisasi Kasur', 'Bebas Tungau'],
      bufferMinutes: 60,
    },
    {
      id: 'worker-budi',
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      specialty: 'Teknisi HVAC & Pendingin Ruangan',
      category: 'Servis AC',
      rating: 4.95,
      reviewCount: 62,
      basecampZone: 'Jagakarsa, Jakarta Selatan',
      startingPrice: 75000,
      priceUnit: 'unit',
      avatarUrl:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
      isVerified: true,
      specialtyTags: ['Cuci AC Inverter', 'Isi Freon R32', 'Bongkar Pasang'],
      bufferMinutes: 60,
    },
    {
      id: 'worker-hendra',
      slug: 'hendra-listrik',
      name: 'Hendra Gunawan',
      specialty: 'Teknisi Instalasi & Panel Listrik',
      category: 'Kelistrikan',
      rating: 4.88,
      reviewCount: 39,
      basecampZone: 'Menteng, Jakarta Pusat',
      startingPrice: 80000,
      priceUnit: 'kunjungan',
      avatarUrl:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      isVerified: true,
      specialtyTags: ['Korsleting', 'MCB Panel', 'Grounding Presisi'],
      bufferMinutes: 90,
    },
    {
      id: 'worker-rian',
      slug: 'rian-audio',
      name: 'Rian Hendrawan',
      specialty: 'Audio & Servis Elektronik',
      category: 'Elektronik',
      rating: 5.0,
      reviewCount: 27,
      basecampZone: 'BSD, Tangerang Selatan',
      startingPrice: 120000,
      priceUnit: 'kunjungan',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      isVerified: true,
      specialtyTags: ['Home Theater', 'Mesin Cuci', 'TV LED Inverter'],
      bufferMinutes: 60,
    },
  ];
}
