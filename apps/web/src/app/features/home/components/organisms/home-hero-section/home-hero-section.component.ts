import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Dark Nocturne Theater Canvas Hero (#121212) -->
    <section
      class="w-full bg-hero-canvas text-ink-on-dark relative overflow-hidden py-space-3xl sm:py-space-4xl border-b border-white/10"
      aria-labelledby="hero-title"
    >
      <!-- Background Architectural Grid Pattern -->
      <div
        class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      ></div>

      <div
        class="max-w-7xl mx-auto px-margin-desktop relative z-10 space-y-space-2xl"
      >
        <!-- Telemetry Status Bar -->
        <div class="flex flex-wrap items-center justify-between gap-space-sm">
          <div
            class="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-caption font-mono-rate"
          >
            <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span
              class="text-ink-on-dark font-medium uppercase tracking-wider text-[11px]"
            >
              Protokol Kedaulatan Pekerja Mandiri • 0% Komisi
            </span>
          </div>
        </div>

        <!-- Asymmetric Headline & Copy -->
        <div class="max-w-4xl space-y-space-md">
          <h1
            id="hero-title"
            class="font-heading-h1 text-[32px] sm:text-[44px] md:text-[52px] font-bold text-white tracking-tight leading-[1.12]"
          >
            Cari Spesialis Terverifikasi.
            <span class="text-voltage-orange block sm:inline"
              >Terhubung Langsung Tanpa Perantara.</span
            >
          </h1>

          <p
            class="font-lead-body text-body-default sm:text-lead-body text-white/70 max-w-2xl leading-relaxed"
          >
            Platform reservasi mandiri untuk teknisi AC, instalasi kelistrikan,
            sanitasi deep clean, dan servis elektronik. Tarif transparan,
            proteksi buffer transit perjalanan, dan kontak langsung ke WhatsApp
            mitra.
          </p>
        </div>

        <!-- Interactive Booking Search Console -->
        <div
          class="p-space-lg sm:p-space-xl bg-surface-elevated-dark/80 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl max-w-5xl"
        >
          <form (ngSubmit)="handleSearchSubmit()" class="space-y-space-md">
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center"
            >
              <!-- Input Keahlian / Spesialisasi -->
              <div class="md:col-span-5 relative">
                <label
                  for="heroSpecialtyInput"
                  class="block font-micro-uppercase text-caption text-white/60 uppercase mb-1.5"
                >
                  Keahlian atau Nama Pekerja
                </label>
                <div class="relative flex items-center">
                  <span
                    class="material-symbols-outlined absolute left-3.5 text-white/40 text-[20px]"
                  >
                    handyman
                  </span>
                  <input
                    id="heroSpecialtyInput"
                    type="text"
                    [ngModel]="specialtyQuery()"
                    (ngModelChange)="specialtyQuery.set($event)"
                    name="specialty"
                    placeholder="Contoh: AC Inverter, Listrik, Sarah..."
                    class="w-full h-12 pl-11 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/40 rounded-lg text-body-default transition-all outline-none border border-white/10 focus:border-voltage-orange"
                  />
                </div>
              </div>

              <!-- Input Lokasi / Area Pangkalan -->
              <div class="md:col-span-4 relative">
                <label
                  for="heroLocationInput"
                  class="block font-micro-uppercase text-caption text-white/60 uppercase mb-1.5"
                >
                  Wilayah / Pangkalan
                </label>
                <div class="relative flex items-center">
                  <span
                    class="material-symbols-outlined absolute left-3.5 text-white/40 text-[20px]"
                  >
                    location_on
                  </span>
                  <input
                    id="heroLocationInput"
                    type="text"
                    [ngModel]="locationQuery()"
                    (ngModelChange)="locationQuery.set($event)"
                    name="location"
                    placeholder="Area: Tebet, Jagakarsa, BSD..."
                    class="w-full h-12 pl-11 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/40 rounded-lg text-body-default transition-all outline-none border border-white/10 focus:border-voltage-orange"
                  />
                </div>
              </div>

              <!-- Tombol Aksi Cari -->
              <div class="md:col-span-3 flex md:self-end pt-2 md:pt-0">
                <button
                  type="submit"
                  class="w-full h-12 px-space-xl bg-voltage-orange hover:bg-voltage-orange/90 text-white font-button-label text-button-label font-bold rounded-lg flex items-center justify-center gap-space-xs transition-all shadow-md cursor-pointer min-h-[48px]"
                >
                  <span class="material-symbols-outlined text-[20px]"
                    >search</span
                  >
                  <span>Temukan Pekerja</span>
                </button>
              </div>
            </div>

            <!-- Quick Filter Chips -->
            <div
              class="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-caption"
            >
              <span class="text-white/50 text-caption font-mono-rate"
                >Kategori Populer:</span
              >
              @for (chip of popularChips; track chip.label) {
                <button
                  type="button"
                  (click)="applyFilterChip(chip.query)"
                  class="px-3.5 py-1.5 min-h-[36px] inline-flex items-center rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-caption transition-colors cursor-pointer"
                >
                  {{ chip.label }}
                </button>
              }
            </div>
          </form>
        </div>

        <!-- 4 Pilar Kepercayaan Tuwaktu -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-lg"
        >
          @for (pillar of trustPillars; track pillar.title) {
            <div
              class="p-space-lg rounded-xl bg-white/5 border border-white/10 space-y-space-xs hover:bg-white/[0.07] transition-colors"
            >
              <div class="flex items-center justify-between">
                <span
                  class="material-symbols-outlined text-[24px] text-voltage-orange"
                >
                  {{ pillar.icon }}
                </span>
                <span
                  class="font-mono-rate text-[10px] uppercase font-bold text-success bg-success/15 px-2 py-0.5 rounded"
                >
                  {{ pillar.badge }}
                </span>
              </div>
              <h3 class="font-heading-h3 text-[15px] font-bold text-white pt-1">
                {{ pillar.title }}
              </h3>
              <p
                class="font-body-default text-caption text-white/60 leading-relaxed"
              >
                {{ pillar.description }}
              </p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroSectionComponent {
  private readonly router = inject(Router);

  readonly specialtyQuery = signal<string>('');
  readonly locationQuery = signal<string>('');

  readonly searchTrigger = output<{ specialty: string; location: string }>();

  readonly popularChips = [
    { label: 'Servis AC HVAC', query: 'ac' },
    { label: 'Sanitasi Deep Clean', query: 'deep clean' },
    { label: 'Instalasi Listrik', query: 'listrik' },
    { label: 'Elektronik & Audio', query: 'elektronik' },
  ];

  readonly trustPillars = [
    {
      title: '0% Potongan Komisi',
      description:
        'Seluruh pembayaran klien 100% diterima langsung oleh pekerja mandiri tanpa potongan.',
      icon: 'percent',
      badge: 'Bebas Potongan',
    },
    {
      title: '100% WhatsApp Langsung',
      description:
        'Komunikasi langsung ke kontak asli pekerja. Tanpa masking dan tanpa sensor nomor.',
      icon: 'chat',
      badge: 'Kontak Mandiri',
    },
    {
      title: 'Buffer Transit Otomatis',
      description:
        'Jeda 60-90 menit antar slot reservasi untuk perjalanan tenang dan tepat waktu.',
      icon: 'timer',
      badge: 'Bebas Bentrok',
    },
    {
      title: 'Kredensial Terverifikasi',
      description:
        'Spesialis melalui verifikasi identitas KTP dan penentuan zona pangkalan nyata.',
      icon: 'verified_user',
      badge: 'Kurasi Ketat',
    },
  ];

  applyFilterChip(query: string): void {
    this.specialtyQuery.set(query);
    this.handleSearchSubmit();
  }

  handleSearchSubmit(): void {
    const specialty = this.specialtyQuery().trim().toLowerCase();
    const location = this.locationQuery().trim();

    // Cek apakah query spesifik mengarah ke salah satu slug pekerja bawaan
    if (specialty.includes('sarah')) {
      this.router.navigate(['/sarah-cleaning']);
      return;
    }
    if (specialty.includes('budi')) {
      this.router.navigate(['/budi-santoso']);
      return;
    }
    if (specialty.includes('hendra')) {
      this.router.navigate(['/hendra-listrik']);
      return;
    }
    if (specialty.includes('rian')) {
      this.router.navigate(['/rian-audio']);
      return;
    }

    this.searchTrigger.emit({
      specialty: this.specialtyQuery().trim(),
      location: location,
    });

    // Scroll ke bagian pekerja unggulan atau katalog
    const targetElement = document.getElementById('spesialis-unggulan');
    if (targetElement && typeof targetElement.scrollIntoView === 'function') {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
