import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-whatsapp-preview-mockup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sticky top-24 flex flex-col gap-6">
      <!-- Mockup Device Frame -->
      <div
        class="bg-surface-elevated-dark rounded-xl p-4 shadow-xl flex flex-col text-on-primary border border-white/10"
      >
        <!-- Mockup Header: WhatsApp Contact Bar -->
        <div
          class="flex items-center justify-between pb-3 mb-3 bg-whatsapp-green -mx-4 -mt-4 p-4 rounded-t-xl"
        >
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px] text-on-primary cursor-pointer select-none">
              arrow_back
            </span>
            <div class="relative">
              <div
                class="w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-body-strong"
              >
                CK
              </div>
              <span
                class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success ring-2 ring-whatsapp-green"
              ></span>
            </div>
            <div class="flex flex-col">
              <span class="font-body-strong text-body-strong text-on-primary leading-tight">
                Calon Klien (via Tuwaktu)
              </span>
              <span class="font-caption text-caption text-whatsapp-surface/90 text-xs">
                Online sekarang
              </span>
            </div>
          </div>
          <div class="flex items-center gap-4 text-on-primary">
            <span class="material-symbols-outlined text-[20px]">videocam</span>
            <span class="material-symbols-outlined text-[20px]">call</span>
            <span class="material-symbols-outlined text-[20px]">more_vert</span>
          </div>
        </div>

        <!-- Mockup Chat Wallpaper Container -->
        <div
          class="bg-[#e5ddd5] p-5 rounded-lg min-h-[420px] flex flex-col justify-end relative shadow-inner overflow-hidden"
          style="background-image: radial-gradient(#d3c6b8 1px, transparent 1px); background-size: 16px 16px;"
        >
          <!-- Encryption Notice Pill -->
          <div
            class="self-center bg-[#ffeecd] text-[#554625] text-center font-caption text-caption px-3 py-1 rounded-md max-w-xs shadow-xs mb-6 text-xs border border-[#e8d7b3]"
          >
            <span class="material-symbols-outlined text-[12px] inline align-middle mr-1">lock</span>
            Pesan dan panggilan terenkripsi secara end-to-end. Langsung ke pemilik profil.
          </div>

          <!-- Inbound Incoming Message Bubble (Client to Worker) -->
          <div
            class="self-start max-w-[94%] bg-white text-ink-on-light p-4 rounded-lg rounded-tl-none shadow-md flex flex-col gap-1.5 relative border border-black/5"
          >
            <!-- Sender Indicator Banner -->
            <div class="flex items-center justify-between pb-1 text-xs border-b border-gray-100">
              <span
                class="font-micro-uppercase text-micro-uppercase text-whatsapp-green font-bold flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-[14px]">link</span>
                INQUIRY PESANAN TUWAKTU
              </span>
              <span class="font-mono-rate text-caption text-ink-secondary">13:42</span>
            </div>

            <!-- Dynamic Live Render Container -->
            <div
              id="live-chat-preview"
              class="font-body-default text-body-default whitespace-pre-wrap text-ink-on-light leading-relaxed select-text font-normal pt-1"
            >
              {{ store.renderedWhatsAppMessagePreview() }}
            </div>

            <!-- Tail and Timestamp Metadata -->
            <div class="self-end flex items-center gap-1 text-[11px] text-ink-secondary mt-1">
              <span>13:42</span>
              <span class="material-symbols-outlined text-[14px] text-accent-focus font-bold">
                done_all
              </span>
            </div>
          </div>
        </div>

        <!-- Mockup Bottom Footer Input Bar -->
        <div class="flex items-center gap-2 pt-3">
          <span class="material-symbols-outlined text-ink-disabled text-[24px]">mood</span>
          <div
            class="flex-1 bg-surface-elevated-dark px-4 py-2 rounded-full text-caption text-ink-secondary flex items-center justify-between border border-white/5"
          >
            <span>Balas ke calon klien...</span>
            <span class="material-symbols-outlined text-[18px]">attach_file</span>
          </div>
          <div
            class="w-9 h-9 rounded-full bg-whatsapp-green flex items-center justify-center text-on-primary shadow-xs shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]">mic</span>
          </div>
        </div>
      </div>

      <!-- Telemetry & Direct Test Action Card -->
      <div
        class="bg-surface-container-lowest p-5 rounded-xl shadow-xs flex flex-col gap-3 border border-hairline-subtle"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-whatsapp-green text-[20px]">chat</span>
            <span class="font-body-strong text-body-strong text-primary">
              Tes Tautan WhatsApp
            </span>
          </div>
          <span class="font-mono-rate text-caption text-success font-semibold">
            SIAP DIGUNAKAN
          </span>
        </div>
        <p class="font-caption text-caption text-ink-secondary leading-relaxed">
          Klik tombol di bawah untuk mencoba tautan WhatsApp (wa.me) yang akan diakses calon klien dari profil Anda:
        </p>
        <a
          id="deep-link-trigger"
          [href]="store.generatedWhatsAppDeepLink()"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full py-3 px-4 bg-whatsapp-green hover:bg-whatsapp-green-hover text-on-primary rounded text-center font-button-label text-button-label flex items-center justify-center gap-2 transition-all shadow-xs min-h-[44px] font-semibold"
        >
          <span class="material-symbols-outlined text-[20px]">open_in_new</span>
          <span>Buka Chat Percobaan</span>
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerWhatsAppPreviewMockupComponent {
  readonly store = inject(WorkerDashboardStore);
}
