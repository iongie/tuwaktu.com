import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { DashboardStatusToggleComponent } from '../../molecules/dashboard-status-toggle/dashboard-status-toggle.component';
import { DashboardQuickLinkComponent } from '../../molecules/dashboard-quick-link/dashboard-quick-link.component';
import { DashboardMetricStatCardComponent } from '../../molecules/dashboard-metric-stat-card/dashboard-metric-stat-card.component';

@Component({
  selector: 'app-worker-dashboard-hero-banner',
  standalone: true,
  imports: [
    CommonModule,
    DashboardStatusToggleComponent,
    DashboardQuickLinkComponent,
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
          class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <!-- Worker Identification & Badges -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div class="relative shrink-0">
              @if (store.workerAvatarUrl()) {
                <img
                  [src]="store.workerAvatarUrl()"
                  [alt]="store.workerFullName() || 'Avatar Mitra'"
                  class="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-white/20 shadow-md"
                />
              } @else {
                <div
                  class="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center text-white font-extrabold text-2xl ring-2 ring-white/20"
                >
                  {{ (store.workerFullName() || 'M').substring(0, 2).toUpperCase() }}
                </div>
              }
              <span
                class="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-(--hero-canvas)"
                [class.bg-emerald-400]="store.isStoreOnline()"
                [class.bg-gray-400]="!store.isStoreOnline()"
              ></span>
            </div>

            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/90"
                >
                  {{ store.workerRecordId() ? ('TWK-' + store.workerRecordId().substring(0, 8).toUpperCase()) : 'TWK-JKT-8821' }}
                </span>
                <span
                  class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-(--whatsapp-green)/40 text-emerald-300"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [class.bg-emerald-400]="store.isStoreOnline()"
                    [class.bg-gray-400]="!store.isStoreOnline()"
                  ></span>
                  {{ store.isStoreOnline() ? 'ONLINE • SIAP ORDER' : 'OFFLINE' }}
                </span>
                <span
                  class="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/80"
                >
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

          <!-- Master Dispatch Switch & Quick Link -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <app-dashboard-status-toggle
              [isOnline]="store.isStoreOnline()"
              (toggleStatus)="store.toggleStoreStatus()"
            />

            @if (store.workerSlugIdentifier()) {
              <app-dashboard-quick-link
                [urlText]="store.publicProfileRelativeUrl()"
                [feedbackMessage]="store.clipboardFeedbackMessage()"
                (copyLink)="store.copyPublicProfileLink()"
              />
            }
          </div>
        </div>
      </div>

      <!-- Bento Metric Matrix 4 Columns -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-dashboard-metric-stat-card
          [label]="'Bulan Berjalan'"
          [value]="28"
          [subtext]="'Pesanan Selesai'"
          [icon]="'task_alt'"
          [trendText]="'+6 order dibanding bulan lalu'"
          [trendIcon]="'arrow_upward'"
          [trendType]="'positive'"
        />

        <app-dashboard-metric-stat-card
          [label]="'Pendapatan Mandiri'"
          [value]="store.formattedBasePricePreview() ? (store.formattedBasePricePreview()! + ' /jam') : 'Rp 4.550.000'"
          [subtext]="'100% Bersih Diterima'"
          [icon]="'lock_open'"
          [trendText]="'0% potongan aplikasi atau makelar'"
          [trendIcon]="'verified'"
          [trendType]="'positive'"
        />

        <app-dashboard-metric-stat-card
          [label]="'Efisiensi Kerja'"
          [value]="'2.5 Jam'"
          [subtext]="'Rata-rata Durasi / Order'"
          [icon]="'timelapse'"
          [trendText]="'70 Jam kumulatif bulan ini'"
          [trendIcon]="'schedule'"
          [trendType]="'neutral'"
        />

        <app-dashboard-metric-stat-card
          [label]="'Reputasi Klien'"
          [value]="'4.9 / 5.0'"
          [subtext]="'128 Ulasan Terverifikasi'"
          [icon]="'star'"
          [trendText]="'Validasi OTP WhatsApp Klien'"
          [trendIcon]="'verified'"
          [trendType]="'positive'"
        />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardHeroBannerComponent {
  readonly store = inject(WorkerDashboardStore);
}

