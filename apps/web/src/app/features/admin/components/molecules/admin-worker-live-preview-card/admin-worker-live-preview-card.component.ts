import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-worker-live-preview-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-[10px] bg-body-canvas border border-hairline-light p-5 space-y-5 shadow-none">
      <!-- Header Telemetri Pratinjau -->
      <div class="flex items-center justify-between border-b border-hairline-subtle pb-3">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-voltage-orange animate-pulse"></span>
          <span class="font-mono-rate text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
            Pratinjau Profil Publik Mitra
          </span>
        </div>
        <span class="font-mono-rate text-[10px] font-bold px-2 py-0.5 rounded border border-hairline-light bg-surface-highlight text-ink-on-light uppercase">
          Live Render
        </span>
      </div>

      <!-- Mock Kartu Profil Publik Klien -->
      <div class="rounded-[10px] bg-surface-highlight border border-hairline-light p-4 space-y-3.5 transition-all">
        <!-- Avatar & Nama -->
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded bg-hero-canvas text-white font-mono-rate font-bold text-base flex items-center justify-center shrink-0 border border-hairline-light">
            {{ initials() }}
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-sm text-ink-on-light truncate leading-snug">
              {{ name() || 'Nama Calon Mitra' }}
            </h4>
            <p class="text-xs text-ink-secondary truncate mt-0.5">
              {{ profession() || 'Spesialisasi / Profesi Belum Diatur' }}
            </p>
            <div class="flex items-center gap-1 text-[11px] text-ink-secondary mt-1">
              <span class="material-symbols-outlined text-[13px] text-voltage-orange">location_on</span>
              <span class="truncate">{{ city() || 'Zona Belum Dipilih' }}</span>
              <span class="text-ink-disabled">•</span>
              <span class="font-mono-rate">{{ maxRadius() || 25 }} km</span>
            </div>
          </div>
        </div>

        <div class="h-px bg-hairline-light"></div>

        <!-- Alamat URL Profil Publik -->
        <div class="flex items-center justify-between gap-2 p-2 rounded bg-body-canvas border border-hairline-light text-xs font-mono-rate">
          <div class="flex items-center gap-1.5 truncate text-ink-secondary">
            <span class="material-symbols-outlined text-[14px] text-voltage-orange">link</span>
            <span class="truncate">tuwaktu.com/{{ slug() || 'slug-mitra' }}</span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-ink-secondary shrink-0">
            Profil Publik
          </span>
        </div>

        <!-- Telemetri Kedaulatan & WhatsApp -->
        <div class="flex items-center justify-between text-[11px] pt-1">
          <div class="flex items-center gap-1 text-emerald-700 font-bold font-mono-rate">
            <span class="material-symbols-outlined text-[14px]">shield_check</span>
            <span>0% Komisi Platform</span>
          </div>
          <div class="font-mono-rate text-ink-secondary">
            WA: {{ formattedWhatsApp() }}
          </div>
        </div>
      </div>

      <!-- Checklist Verifikasi Keandalan Admin -->
      <div class="p-3.5 rounded bg-surface-highlight border border-hairline-light space-y-2">
        <div class="flex items-center gap-1.5 text-xs font-bold text-ink-on-light">
          <span class="material-symbols-outlined text-[16px] text-voltage-orange">checklist</span>
          <span>Protokol Onboarding Mitra Admin</span>
        </div>
        <ul class="text-[11px] text-ink-secondary space-y-1.5 leading-relaxed pl-1">
          <li class="flex items-start gap-1.5">
            <span class="text-voltage-orange font-bold font-mono-rate">1.</span>
            <span>Pastikan nomor WhatsApp aktif untuk verifikasi pesanan klien.</span>
          </li>
          <li class="flex items-start gap-1.5">
            <span class="text-voltage-orange font-bold font-mono-rate">2.</span>
            <span>Setelah data tersimpan, serahkan PIN awal 6-digit kepada mitra.</span>
          </li>
          <li class="flex items-start gap-1.5">
            <span class="text-voltage-orange font-bold font-mono-rate">3.</span>
            <span>Mitra dapat langsung menyunting tarif & jadwal mandiri di dashboard.</span>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class AdminWorkerLivePreviewCardComponent {
  readonly name = input<string>('');
  readonly profession = input<string>('');
  readonly city = input<string>('');
  readonly whatsapp = input<string>('');
  readonly slug = input<string>('');
  readonly maxRadius = input<number>(25);

  readonly initials = computed<string>(() => {
    const raw = this.name().trim();
    if (!raw) return 'TW';
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  });

  readonly formattedWhatsApp = computed<string>(() => {
    const wa = this.whatsapp().trim();
    if (!wa) return '-';
    return wa;
  });
}

