import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-dispatch-simulator-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-hero-canvas text-ink-on-dark rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-md"
      aria-label="Simulasi Format Notifikasi WhatsApp"
    >
      <div class="flex items-center justify-between border-b-0 pb-1">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-whatsapp-green text-[18px]">terminal</span>
          <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled uppercase font-semibold">
            SIMULASI FORMAT DISPATCH
          </span>
        </div>
        <span class="font-mono-rate text-mono-rate text-whatsapp-green text-xs font-bold">
          READY STATUS
        </span>
      </div>

      <div
        class="bg-surface-elevated-dark p-3.5 rounded-lg flex flex-col gap-1.5 font-mono-rate text-mono-rate text-xs text-ink-disabled leading-relaxed"
      >
        <div class="text-voltage-orange font-bold">Halo Tuwaktu, pesanan baru masuk!</div>
        <div class="text-ink-on-dark">Klien: Budi Santoso (+62 811-2233-44)</div>
        <div>
          Layanan:
          <span class="text-ink-on-dark font-medium">{{ specialtyLabel() }}</span>
        </div>
        <div>Jadwal: Sesi Siang (13:00 - 16:30 WIB)</div>
        <div>
          Lokasi: {{ basecamp() ? basecamp() : 'Basecamp Terdaftar' }} (+3 km dari Basecamp)
        </div>
        <div class="pt-2 text-whatsapp-surface border-t border-white/10 font-semibold">
          Total Tarif Bersih: Rp 215.000 (Komisi Tuwaktu: Rp 0)
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-ink-disabled">
        <span class="material-symbols-outlined text-[14px]">format_image_left</span>
        <span class="font-caption text-caption text-xs">
          Tautan web Anda bekerja 24 jam menerima pesanan otomatis tanpa instalasi aplikasi klien.
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthDispatchSimulatorCardComponent {
  readonly specialtyLabel = input<string>('Spesialis Kebersihan Hunian');
  readonly basecamp = input<string>('');
}
