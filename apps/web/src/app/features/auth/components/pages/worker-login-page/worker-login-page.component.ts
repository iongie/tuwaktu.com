import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthHeaderNavComponent } from '../../molecules/auth-header-nav/auth-header-nav.component';
import { AuthFooterBarComponent } from '../../molecules/auth-footer-bar/auth-footer-bar.component';
import { WorkerLoginFormComponent } from '../../organisms/worker-login-form/worker-login-form.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-worker-login-page',
  standalone: true,
  imports: [
    CommonModule,
    AuthHeaderNavComponent,
    AuthFooterBarComponent,
    WorkerLoginFormComponent,
  ],
  template: `
    <div class="bg-surface font-body-default text-on-surface antialiased min-h-screen flex flex-col justify-between">
      <app-auth-header-nav activeTab="login" />

      <main class="w-full flex-1 flex flex-col justify-center items-center py-10 px-6 lg:px-12">
        <div class="flex flex-col w-full max-w-7xl mx-auto gap-8">
          <div
            class="grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden shadow-xl bg-body-canvas border border-hairline-subtle/50"
          >
            <!-- Sisi Kiri: Ringkasan Manfaat Mitra (5 Cols) -->
            <div
              class="lg:col-span-5 bg-hero-canvas p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-ink-on-dark"
            >
              <div class="flex flex-col gap-6">
                <span
                  class="font-micro-uppercase text-micro-uppercase tracking-widest text-on-primary-container uppercase font-bold"
                >
                  MASUK MITRA TUWAKTU
                </span>

                <div class="flex flex-col gap-2.5">
                  <h1 class="font-heading-h1 text-heading-h1 text-ink-on-dark font-bold leading-tight">
                    Kelola Jadwal &amp; Pesanan Anda.
                  </h1>
                  <p class="font-body-default text-body-default text-surface-tint leading-relaxed text-gray-400">
                    Atur ketersediaan jam kerja, tentukan tarif layanan, dan terima pesanan langsung
                    ke WhatsApp tanpa potongan komisi.
                  </p>
                </div>

                <!-- Poin Manfaat Utama -->
                <div class="flex flex-col gap-4 pt-2">
                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-8 h-8 rounded bg-surface-elevated-dark flex items-center justify-center shrink-0 text-whatsapp-surface"
                    >
                      <span class="material-symbols-outlined text-[18px]">payments</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-body-strong text-ink-on-dark font-semibold">
                        0% Potongan Komisi
                      </span>
                      <span class="font-caption text-caption text-gray-400">
                        Semua pembayaran jasa langsung masuk ke Anda tanpa potongan aplikasi.
                      </span>
                    </div>
                  </div>

                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-8 h-8 rounded bg-surface-elevated-dark flex items-center justify-center shrink-0 text-voltage-orange"
                    >
                      <span class="material-symbols-outlined text-[18px]">calendar_month</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-body-strong text-ink-on-dark font-semibold">
                        Jadwal Kerja Teratur
                      </span>
                      <span class="font-caption text-caption text-gray-400">
                        Atur jam operasional, tanggal libur, dan jeda antar-pesanan agar tidak bentrok.
                      </span>
                    </div>
                  </div>

                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-8 h-8 rounded bg-surface-elevated-dark flex items-center justify-center shrink-0 text-success"
                    >
                      <span class="material-symbols-outlined text-[18px]">forum</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-body-strong text-ink-on-dark font-semibold">
                        Pesanan Langsung ke WhatsApp
                      </span>
                      <span class="font-caption text-caption text-gray-400">
                        Rincian pesanan dari profil publik Anda langsung terkirim ke nomor WhatsApp pribadi.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="pt-6 mt-6 flex items-center justify-between text-gray-400 font-caption text-caption border-t border-white/10"
              >
                <span>Tuwaktu Mitra</span>
                <span class="font-mono-rate text-mono-rate text-gray-300">Wilayah: Jabodetabek</span>
              </div>
            </div>

            <!-- Sisi Kanan: Form Masuk Utama (7 Cols) -->
            <div class="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-body-canvas min-h-[520px]">
              @if (!authService.isInitialized()) {
                <!-- Skeleton / Indikator Loading saat Inisialisasi Sesi (Mencegah Kedipan Form) -->
                <div
                  class="flex-1 flex flex-col justify-center items-center py-16 px-4 gap-4 text-center"
                  role="status"
                  aria-live="polite"
                  data-testid="session-initializing-loader"
                >
                  <div class="relative w-12 h-12 flex items-center justify-center">
                    <span class="w-12 h-12 rounded-full border-2 border-hairline-subtle border-t-primary animate-spin"></span>
                    <span class="material-symbols-outlined text-primary text-[20px] absolute">sync_lock</span>
                  </div>
                  <div class="flex flex-col gap-1.5 max-w-xs animate-pulse">
                    <span class="font-body-strong text-body-strong text-on-surface">Memeriksa Sesi...</span>
                    <span class="font-caption text-caption text-ink-secondary">
                      Memuat halaman masuk mitra Tuwaktu
                    </span>
                    <div class="h-2 w-32 bg-surface-container-high rounded-full mx-auto mt-2"></div>
                  </div>
                  <span class="sr-only">Sedang memverifikasi sesi aktif...</span>
                </div>
              } @else {
                <app-worker-login-form />
              }
            </div>
          </div>
        </div>
      </main>

      <app-auth-footer-bar />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerLoginPageComponent {
  readonly authService = inject(AuthService);
}
