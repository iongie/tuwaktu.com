import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { DashboardStatusToggleComponent } from '../../molecules/dashboard-status-toggle/dashboard-status-toggle.component';
import { DashboardMetricStatCardComponent } from '../../molecules/dashboard-metric-stat-card/dashboard-metric-stat-card.component';

@Component({
  selector: 'app-worker-dashboard-hero-banner',
  standalone: true,
  imports: [
    CommonModule,
    DashboardStatusToggleComponent,
    DashboardMetricStatCardComponent,
  ],
  template: `
    <section class="space-y-6">
      <!-- Nocturne Theater Canvas Sovereign Hero Panel (#121212) -->
      <div
        class="relative overflow-hidden rounded-2xl bg-(--hero-canvas) text-white p-6 sm:p-8 border border-white/10 shadow-lg"
      >
        <!-- Background Ambient Accent Glow -->
        <div
          class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-(--voltage-orange)/15 blur-3xl pointer-events-none"
        ></div>

        <div
          class="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6"
        >
          <!-- Worker Identification & Badges -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div class="relative shrink-0">
              <img
                [src]="store.workerAvatarUrl() || fallbackAvatar"
                [alt]="store.workerFullName() || 'Avatar Mitra'"
                class="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover ring-2 ring-white/20 shadow-md"
              />
              <span
                class="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-(--hero-canvas)"
                [class.bg-emerald-400]="store.isStoreOnline()"
                [class.bg-gray-400]="!store.isStoreOnline()"
              ></span>
            </div>

            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/10"
                >
                  {{ workerBadgeCode() }}
                </span>
                <span
                  class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [class.bg-emerald-400]="store.isStoreOnline()"
                    [class.bg-gray-400]="!store.isStoreOnline()"
                    [class.animate-pulse]="store.isStoreOnline()"
                  ></span>
                  {{ store.isStoreOnline() ? 'ONLINE • SIAP ORDER' : 'OFFLINE' }}
                </span>
                <span
                  class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10"
                >
                  <span class="material-symbols-outlined text-[13px] text-emerald-300">verified</span>
                  Dokumen Terverifikasi KTP
                </span>
              </div>

              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {{ store.workerFullName() || 'Sarah Melinda' }}
              </h1>
              <p class="text-xs sm:text-sm text-white/70 max-w-xl font-normal">
                {{ store.workerProfessionZone() || 'Spesialis Sanitasi Hunian & Deep Cleaning Mandiri' }}
              </p>
            </div>
          </div>

          <!-- Sovereign Link Widget & Status Toggle -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <!-- Sovereign Link Card with QR Code Preview SVG -->
            <div
              class="bg-white/5 border border-white/10 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-white shadow-sm"
            >
              <!-- QR Code Preview SVG Container -->
              <div
                class="w-16 h-16 sm:w-18 sm:h-18 bg-white rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-xs"
                title="QR Code Profil Klien"
              >
                <svg
                  class="w-full h-full text-black"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <!-- Top-Left Finder Pattern -->
                  <rect x="0" y="0" width="30" height="30" rx="3" fill="#121212" />
                  <rect x="6" y="6" width="18" height="18" rx="2" fill="#ffffff" />
                  <rect x="11" y="11" width="8" height="8" rx="1" fill="#121212" />

                  <!-- Top-Right Finder Pattern -->
                  <rect x="70" y="0" width="30" height="30" rx="3" fill="#121212" />
                  <rect x="76" y="6" width="18" height="18" rx="2" fill="#ffffff" />
                  <rect x="81" y="11" width="8" height="8" rx="1" fill="#121212" />

                  <!-- Bottom-Left Finder Pattern -->
                  <rect x="0" y="70" width="30" height="30" rx="3" fill="#121212" />
                  <rect x="6" y="76" width="18" height="18" rx="2" fill="#ffffff" />
                  <rect x="11" y="81" width="8" height="8" rx="1" fill="#121212" />

                  <!-- Timing & Data Matrix Blocks -->
                  <rect x="36" y="8" width="6" height="6" fill="#121212" />
                  <rect x="48" y="8" width="6" height="6" fill="#121212" />
                  <rect x="58" y="8" width="6" height="6" fill="#121212" />
                  <rect x="36" y="20" width="6" height="6" fill="#121212" />
                  <rect x="50" y="20" width="6" height="6" fill="#121212" />

                  <rect x="8" y="36" width="6" height="6" fill="#121212" />
                  <rect x="8" y="48" width="6" height="6" fill="#121212" />
                  <rect x="8" y="58" width="6" height="6" fill="#121212" />

                  <rect x="36" y="36" width="8" height="8" rx="1" fill="#ff5500" />
                  <rect x="48" y="36" width="6" height="6" fill="#121212" />
                  <rect x="58" y="36" width="6" height="6" fill="#121212" />
                  <rect x="72" y="36" width="6" height="6" fill="#121212" />
                  <rect x="84" y="36" width="6" height="6" fill="#121212" />

                  <rect x="36" y="48" width="6" height="6" fill="#121212" />
                  <rect x="48" y="48" width="8" height="8" rx="1" fill="#121212" />
                  <rect x="64" y="48" width="6" height="6" fill="#121212" />
                  <rect x="78" y="48" width="6" height="6" fill="#121212" />

                  <rect x="36" y="62" width="6" height="6" fill="#121212" />
                  <rect x="48" y="62" width="6" height="6" fill="#121212" />
                  <rect x="60" y="62" width="6" height="6" fill="#121212" />
                  <rect x="72" y="62" width="8" height="8" rx="1" fill="#121212" />

                  <rect x="36" y="76" width="6" height="6" fill="#121212" />
                  <rect x="48" y="76" width="6" height="6" fill="#121212" />
                  <rect x="62" y="76" width="6" height="6" fill="#121212" />
                  <rect x="78" y="76" width="6" height="6" fill="#121212" />

                  <rect x="36" y="88" width="6" height="6" fill="#121212" />
                  <rect x="48" y="88" width="6" height="6" fill="#121212" />
                  <rect x="60" y="88" width="6" height="6" fill="#121212" />
                  <rect x="72" y="88" width="6" height="6" fill="#121212" />
                  <rect x="84" y="88" width="6" height="6" fill="#121212" />
                </svg>
              </div>

              <!-- Link & Actions -->
              <div class="space-y-1.5 flex-1 min-w-0">
                <span class="text-[10px] font-mono uppercase tracking-wider text-white/60 block">
                  Tautan Publik Klien
                </span>
                <div class="font-mono text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  tuwaktu.com/{{ store.workerSlugIdentifier() || 'sarah-cleaning' }}
                </div>
                <div class="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    (click)="copyLink()"
                    class="min-h-[44px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                    aria-label="Salin Tautan Publik"
                  >
                    <span class="material-symbols-outlined text-[15px]">
                      {{ isCopied() ? 'check' : 'content_copy' }}
                    </span>
                    <span>{{ isCopied() ? 'Tersalin!' : 'Salin' }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="shareLink()"
                    class="min-h-[44px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                    aria-label="Bagikan Tautan Publik"
                  >
                    <span class="material-symbols-outlined text-[15px]">share</span>
                    <span>{{ isShared() ? 'Dibagikan!' : 'Bagikan' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Master Dispatch Toggle Button -->
            <app-dashboard-status-toggle
              [isOnline]="store.isStoreOnline()"
              (toggleStatus)="store.toggleStoreStatus()"
            />
          </div>
        </div>
      </div>

      <!-- Bento Metric Matrix 4 Columns -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Bulan Berjalan -->
        <app-dashboard-metric-stat-card
          [label]="'Bulan Berjalan'"
          [value]="28"
          [subtext]="'Pesanan Selesai'"
          [icon]="'task_alt'"
          [trendText]="'+6 order dibanding bulan lalu'"
          [trendIcon]="'arrow_upward'"
          [trendType]="'positive'"
        />

        <!-- 2. Pendapatan Mandiri -->
        <app-dashboard-metric-stat-card
          [label]="'Pendapatan Mandiri'"
          [value]="'Rp 4.550.000'"
          [subtext]="'100% Bersih Diterima'"
          [icon]="'payments'"
          [badgeText]="'0% POTONGAN'"
          [badgeType]="'positive'"
          [trendText]="'Tanpa potongan aplikasi/makelar'"
          [trendIcon]="'verified'"
          [trendType]="'positive'"
        />

        <!-- 3. Efisiensi Kerja -->
        <app-dashboard-metric-stat-card
          [label]="'Efisiensi Kerja'"
          [value]="'2.5 Jam'"
          [subtext]="'Rata-rata Durasi/Order'"
          [icon]="'timelapse'"
          [trendText]="'70 Jam kumulatif bulan ini'"
          [trendIcon]="'schedule'"
          [trendType]="'neutral'"
        />

        <!-- 4. Reputasi Klien -->
        <app-dashboard-metric-stat-card
          [label]="'Reputasi Klien'"
          [value]="'4.9 / 5.0'"
          [subtext]="'128 Ulasan Terverifikasi'"
          [icon]="'star'"
          [starsCount]="5"
          [trendText]="'Validasi OTP WhatsApp Klien'"
          [trendIcon]="'verified_user'"
          [trendType]="'positive'"
        />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardHeroBannerComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly isCopied = signal(false);
  readonly isShared = signal(false);

  readonly fallbackAvatar =
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';

  readonly workerBadgeCode = computed(() => {
    const id = this.store.workerRecordId().trim();
    if (!id) return 'TWK-JKT-8821';
    if (id.startsWith('TWK-')) return id;
    return 'TWK-' + id.substring(0, 8).toUpperCase();
  });

  copyLink(): void {
    this.store.copyPublicProfileLink();
    this.isCopied.set(true);
    setTimeout(() => this.isCopied.set(false), 2000);
  }

  shareLink(): void {
    const slug = this.store.workerSlugIdentifier() || 'sarah-cleaning';
    const fullName = this.store.workerFullName() || 'Sarah Melinda';
    const url = `https://tuwaktu.com/${slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `${fullName} - Tuwaktu`,
          text: 'Pesan layanan sanitasi langsung tanpa komisi aplikasi di Tuwaktu',
          url: url,
        })
        .then(() => {
          this.isShared.set(true);
          setTimeout(() => this.isShared.set(false), 2000);
        })
        .catch((err: unknown) => {
          const isAbort =
            err instanceof Error && err.name === 'AbortError';
          if (!isAbort) {
            this.copyLink();
          }
        });
    } else {
      this.copyLink();
      this.isShared.set(true);
      setTimeout(() => this.isShared.set(false), 2000);
    }
  }
}
