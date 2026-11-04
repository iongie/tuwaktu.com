import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { AuthHeaderNavComponent } from '../../molecules/auth-header-nav/auth-header-nav.component';
import { AuthFooterBarComponent } from '../../molecules/auth-footer-bar/auth-footer-bar.component';
import { AuthDispatchSimulatorCardComponent } from '../../molecules/auth-dispatch-simulator-card/auth-dispatch-simulator-card.component';
import { AuthSecurityGuaranteeStripComponent } from '../../molecules/auth-security-guarantee-strip/auth-security-guarantee-strip.component';
import { WorkerRegisterFormComponent } from '../../organisms/worker-register-form/worker-register-form.component';

@Component({
  selector: 'app-worker-register-page',
  standalone: true,
  imports: [
    CommonModule,
    AuthHeaderNavComponent,
    AuthFooterBarComponent,
    AuthDispatchSimulatorCardComponent,
    AuthSecurityGuaranteeStripComponent,
    WorkerRegisterFormComponent,
  ],
  template: `
    <div class="bg-surface font-body-default text-on-surface antialiased min-h-screen flex flex-col justify-between">
      <app-auth-header-nav activeTab="register" />

      <main class="w-full flex-1 flex flex-col justify-center items-center py-10 px-6 lg:px-12">
        <div class="flex flex-col w-full max-w-7xl mx-auto gap-8">
          <!-- Top Progress & Context Meta -->
          <div
            class="w-full bg-hero-canvas text-ink-on-dark rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md relative overflow-hidden"
          >
            <div
              class="absolute -right-12 -top-12 w-48 h-48 bg-voltage-orange/10 rounded-full blur-3xl pointer-events-none"
            ></div>
            <div class="flex flex-col gap-1.5 z-10">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="w-2 h-2 rounded-full bg-voltage-orange animate-pulse"></span>
                <span
                  class="font-micro-uppercase text-micro-uppercase text-voltage-orange tracking-widest uppercase font-bold"
                >
                  Direct Sovereign Onboarding
                </span>
                <span class="text-hairline-light/30 text-xs">/</span>
                <span class="font-caption text-caption text-ink-disabled">
                  Protokol Tanpa Perantara Pihak Ketiga
                </span>
              </div>
              <h1 class="font-heading-h1 text-heading-h1 tracking-tight text-ink-on-dark font-bold">
                Mulai Bisnis Jasa Mandiri Anda
              </h1>
              <p class="font-lead-body text-lead-body text-ink-disabled max-w-2xl">
                Daftar gratis tanpa potongan komisi sepeser pun. Langsung terhubung ke klien via
                WhatsApp Anda.
              </p>
            </div>

            <!-- Real-time Step Node Indicator -->
            <div
              class="flex items-center gap-3 z-10 bg-surface-elevated-dark px-4 py-2.5 rounded-lg self-start md:self-auto shrink-0"
              aria-label="Tahapan Registrasi"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded bg-voltage-orange text-ink-on-dark flex items-center justify-center font-mono-rate text-mono-rate font-bold"
                >
                  1
                </div>
                <div class="flex flex-col">
                  <span class="font-micro-uppercase text-micro-uppercase text-voltage-orange font-bold">
                    FASE 01
                  </span>
                  <span class="font-button-label text-button-label text-ink-on-dark font-semibold">
                    Akses & Tautan
                  </span>
                </div>
              </div>

              <span class="material-symbols-outlined text-ink-disabled text-sm">
                arrow_forward
              </span>

              <div class="flex items-center gap-2 opacity-60">
                <div
                  class="w-6 h-6 rounded bg-surface-container-high text-on-surface-variant flex items-center justify-center font-mono-rate text-mono-rate font-bold"
                >
                  2
                </div>
                <div class="flex flex-col">
                  <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled font-semibold">
                    FASE 02
                  </span>
                  <span class="font-button-label text-button-label text-ink-disabled">
                    Tarif & Radius
                  </span>
                </div>
              </div>

              <span class="material-symbols-outlined text-ink-disabled text-sm">
                arrow_forward
              </span>

              <div class="flex items-center gap-2 opacity-40">
                <div
                  class="w-6 h-6 rounded bg-surface-container-high text-on-surface-variant flex items-center justify-center font-mono-rate text-mono-rate font-bold"
                >
                  3
                </div>
                <div class="flex flex-col">
                  <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled font-semibold">
                    FASE 03
                  </span>
                  <span class="font-button-label text-button-label text-ink-disabled">
                    Siap Bekerja
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Bento Grid: Form Engine + Telemetry Doctrine Panel -->
          <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Primary Form Canvas (7 Cols) -->
            <div class="lg:col-span-7">
              <app-worker-register-form (basecampChange)="currentBasecamp.set($event)" />
            </div>

            <!-- Right Column: Sovereignty Manifesto & Telemetry Sandbox (5 Cols) -->
            <div class="lg:col-span-5 flex flex-col gap-6">
              <!-- Pillar Cards Grid -->
              <div class="flex flex-col gap-3.5">
                <!-- Pillar 1: 0% Komisi -->
                <div
                  class="bg-body-canvas rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1 relative overflow-hidden"
                >
                  <div class="flex items-center justify-between">
                    <div
                      class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-voltage-orange"
                    >
                      <span class="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                    <span
                      class="font-mono-rate text-mono-rate bg-warning-surface text-warning px-2.5 py-0.5 rounded font-bold"
                    >
                      0.00% FEE
                    </span>
                  </div>
                  <h3 class="font-heading-h3 text-heading-h3 text-ink-on-light mt-2 font-bold">
                    0% Komisi Selamanya
                  </h3>
                  <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
                    Semua hasil jerih payah Anda 100% masuk ke saku Anda. Pembayaran langsung
                    diterima secara tunai atau QRIS rekening bank pribadi Anda tanpa potongan
                    dompet aplikasi.
                  </p>
                </div>

                <!-- Pillar 2: Buffer Protection -->
                <div
                  class="bg-body-canvas rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1"
                >
                  <div class="flex items-center justify-between">
                    <div
                      class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary"
                    >
                      <span class="material-symbols-outlined text-[24px]">hourglass_empty</span>
                    </div>
                    <span
                      class="font-mono-rate text-mono-rate bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded font-bold"
                    >
                      GUARD 60-90M
                    </span>
                  </div>
                  <h3 class="font-heading-h3 text-heading-h3 text-ink-on-light mt-2 font-bold">
                    Anti-Bentrok & Buffer Otomatis
                  </h3>
                  <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
                    Mesin kalender cerdas otomatis mengunci jeda waktu istirahat dan perjalanan antar
                    lokasi. Tidak ada lagi stres akibat jadwal tumpang tindih atau kelelahan di
                    jalan.
                  </p>
                </div>

                <!-- Pillar 3: WhatsApp Handoff -->
                <div
                  class="bg-body-canvas rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1"
                >
                  <div class="flex items-center justify-between">
                    <div
                      class="w-10 h-10 rounded-lg bg-whatsapp-surface flex items-center justify-center text-whatsapp-green"
                    >
                      <span class="material-symbols-outlined text-[24px]">chat</span>
                    </div>
                    <span
                      class="font-mono-rate text-mono-rate bg-whatsapp-surface text-whatsapp-ink px-2.5 py-0.5 rounded font-bold"
                    >
                      DIRECT CHAT
                    </span>
                  </div>
                  <h3 class="font-heading-h3 text-heading-h3 text-ink-on-light mt-2 font-bold">
                    Direct WhatsApp Handoff
                  </h3>
                  <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
                    Klien memilih slot dan memasukkan alamat di link web Anda, rincian biaya
                    langsung terkirim terstruktur ke WhatsApp Anda. Anda memegang nomor kontak
                    klien seutuhnya.
                  </p>
                </div>
              </div>

              <!-- Live Visual Verification Simulator (Interactive Card) -->
              <app-auth-dispatch-simulator-card
                [specialtyLabel]="authService.selectedSpecialty().label"
                [basecamp]="currentBasecamp()"
              />

              <!-- Visual Worker Snapshot (Authentic Representation) -->
              <div
                class="relative rounded-xl overflow-hidden shadow-sm h-48 bg-surface-container flex items-end p-5"
              >
                <div
                  class="absolute inset-0 bg-cover bg-center"
                  style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAvCL7yXjGNUP_2UmtE5SU_uXQUzaOS6D3pW7h2i9AA8TB-y3G7OzsINReIFLyip6lL_CYImgbAZLlrr5F1VGCMoxY-1_3RZECcq6hjG301fB78_jkIQTg8zwOt-OgqSA6JDdh9jvNsQtW_ISkfDcqYUKYZZUN23G-PLU_FnZgEtR-Ud9sab-6Aajvm0T7awSx366VsKQbS8vhjhSIdCj8Bmte7HO3ujkjd-lKWC8I')"
                  role="img"
                  aria-label="Dokumentasi pekerja teknisi mandiri"
                ></div>
                <div
                  class="absolute inset-0 bg-gradient-to-t from-hero-canvas/90 via-hero-canvas/40 to-transparent"
                ></div>
                <div class="relative z-10 flex flex-col">
                  <span class="font-micro-uppercase text-micro-uppercase text-voltage-orange font-bold">
                    KOMUNITAS SPESIALIS
                  </span>
                  <span class="font-lead-body text-lead-body text-ink-on-dark font-bold leading-snug">
                    "Pendapatan saya naik 35% sejak berhenti membayar komisi potongan aplikasi."
                  </span>
                  <span class="font-caption text-caption text-ink-disabled mt-1">
                    - Rian Hendrawan, Teknisi Servis AC Jakarta
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Security & Guarantee Strip -->
          <app-auth-security-guarantee-strip />
        </div>
      </main>

      <app-auth-footer-bar />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerRegisterPageComponent {
  readonly authService = inject(AuthService);
  readonly currentBasecamp = signal<string>('');
}
