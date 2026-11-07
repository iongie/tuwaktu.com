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
            <!-- Sisi Kiri: Nocturne Manifest Canvas (5 Cols) -->
            <div
              class="lg:col-span-5 bg-hero-canvas p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-ink-on-dark relative overflow-hidden"
            >
              <div
                class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-voltage-orange/10 blur-3xl pointer-events-none"
              ></div>
              <div
                class="absolute -left-12 bottom-12 w-48 h-48 rounded-full bg-whatsapp-green/20 blur-2xl pointer-events-none"
              ></div>

              <div class="flex flex-col gap-6 relative z-10">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-voltage-orange animate-pulse"></span>
                  <span
                    class="font-micro-uppercase text-micro-uppercase tracking-widest text-on-primary-container uppercase font-bold"
                  >
                    PORTAL AKSES PEKERJA MANDIRI
                  </span>
                </div>

                <div class="flex flex-col gap-2.5">
                  <h1 class="font-heading-h1 text-heading-h1 text-ink-on-dark font-bold leading-tight">
                    Akses Langsung Mitra Mandiri.
                  </h1>
                  <p class="font-body-default text-body-default text-surface-tint leading-relaxed text-gray-400">
                    0% Potongan Komisi, 100% Kontrol Data di Tangan Anda. Tuwaktu beroperasi tanpa
                    ketergantungan akun pihak ketiga. Identitas kerja Anda sepenuhnya milik Anda.
                  </p>
                </div>

                <!-- Metrik & Visual Telemetri -->
                <div class="p-4 bg-surface-elevated-dark rounded-lg flex flex-col gap-2.5 border border-white/5">
                  <div
                    class="flex items-center justify-between text-surface-variant font-micro-uppercase text-micro-uppercase text-xs"
                  >
                    <span>STATUS SISTEM DISPATCH</span>
                    <span class="text-whatsapp-surface flex items-center gap-1.5 font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
                      SISTEM SIAP DIGUNAKAN
                    </span>
                  </div>

                  <div
                    class="w-full h-12 flex items-center justify-between px-2 bg-hero-canvas/60 rounded"
                    aria-hidden="true"
                  >
                    <svg class="w-full h-8 text-voltage-orange" fill="none" viewBox="0 0 260 32">
                      <path
                        d="M0 16 Q 15 4, 30 16 T 60 16 T 90 8 T 120 24 T 150 16 T 180 6 T 210 20 T 240 14 T 260 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  </div>

                  <div class="flex justify-between font-caption text-caption text-gray-400 text-xs">
                    <span>Koneksi API Terenkripsi</span>
                    <span>Enkripsi HTTPS & Kriptografi Modern</span>
                  </div>
                </div>

                <!-- Kredensial Pilar Layanan Mandiri -->
                <div class="flex flex-col gap-4">
                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-8 h-8 rounded bg-surface-elevated-dark flex items-center justify-center shrink-0 text-whatsapp-surface"
                    >
                      <span class="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-body-strong text-ink-on-dark font-semibold">
                        Keamanan Akses Terenkripsi
                      </span>
                      <span class="font-caption text-caption text-gray-400">
                        Akses aman tanpa pelacakan iklan pihak ketiga atau manipulasi data pelanggan.
                      </span>
                    </div>
                  </div>

                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-8 h-8 rounded bg-surface-elevated-dark flex items-center justify-center shrink-0 text-voltage-orange"
                    >
                      <span class="material-symbols-outlined text-[18px]">sync_saved_locally</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-body-strong text-ink-on-dark font-semibold">
                        Sinkronisasi Slot Kalender Seketika
                      </span>
                      <span class="font-caption text-caption text-gray-400">
                        Perubahan buffer transit dan tarif radius langsung terupdate pada halaman
                        profil publik.
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
                        Jalur Cepat WhatsApp Dispatch
                      </span>
                      <span class="font-caption text-caption text-gray-400">
                        Pesanan terverifikasi diteruskan langsung ke WhatsApp pribadi tanpa
                        tahanan escrow.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="pt-6 mt-6 relative z-10 flex items-center justify-between text-gray-400 font-caption text-caption border-t border-white/10"
              >
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-whatsapp-surface">
                    verified
                  </span>
                  <span>Zero Third-Party Trackers</span>
                </div>
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
                    <span class="font-body-strong text-body-strong text-on-surface">Memverifikasi Sesi...</span>
                    <span class="font-caption text-caption text-ink-secondary">
                      Menghubungkan ke simpul otentikasi mandiri Tuwaktu
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
