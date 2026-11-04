import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-public-preview-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold tracking-wider">
          STATUS VISIBILITAS PUBLIK
        </span>
        <span class="flex items-center gap-1.5 bg-success-surface text-success px-2 py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold border border-success/20">
          <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse motion-reduce:animate-none"></span>
          LIVE
        </span>
      </div>

      <div class="flex flex-col gap-space-xs">
        <span class="font-body-strong text-body-strong text-primary font-bold">
          Tampilan Pemesan di Web
        </span>
        <p class="font-caption text-caption text-ink-secondary">
          Klien Anda melihat ketersediaan slot berikut secara real-time di halaman booking:
        </p>
      </div>

      <!-- Mini public calendar mockup preview -->
      <div class="bg-surface-highlight p-space-md rounded-xl border border-hairline-subtle flex flex-col gap-space-sm">
        <div class="flex items-center justify-between pb-space-xs border-b border-hairline-subtle/60">
          <span class="font-micro-uppercase text-micro-uppercase text-primary font-bold">
            BESOK, 25 OKTOBER
          </span>
          <span class="font-caption text-caption text-ink-secondary font-medium">
            {{ workerName() || 'Sarah Melinda' }}
          </span>
        </div>

        <!-- Micro Pills -->
        <div class="flex flex-col gap-1.5">
          <!-- Slot 1 Booked -->
          <div class="flex items-center justify-between bg-surface-container px-space-md py-2 rounded-lg opacity-60">
            <span class="font-mono-rate text-mono-rate text-ink-secondary line-through">
              08:30 - 11:30 WIB
            </span>
            <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled font-bold">
              TERISI
            </span>
          </div>

          <!-- Transit Buffer 1 -->
          <div class="flex items-center justify-between bg-surface-dim px-space-md py-1.5 rounded-lg">
            <span class="font-caption text-caption text-ink-secondary italic">
              Transit Buffer (Locked)
            </span>
            <span class="material-symbols-outlined text-[14px] text-ink-secondary">lock</span>
          </div>

          <!-- Slot 2 Booked -->
          <div class="flex items-center justify-between bg-surface-container px-space-md py-2 rounded-lg opacity-60">
            <span class="font-mono-rate text-mono-rate text-ink-secondary line-through">
              13:00 - 16:00 WIB
            </span>
            <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled font-bold">
              TERISI
            </span>
          </div>

          <!-- Transit Buffer 2 -->
          <div class="flex items-center justify-between bg-surface-dim px-space-md py-1.5 rounded-lg">
            <span class="font-caption text-caption text-ink-secondary italic">
              Transit Buffer (Locked)
            </span>
            <span class="material-symbols-outlined text-[14px] text-ink-secondary">lock</span>
          </div>

          <!-- Slot 3 Available or Locked -->
          @if (!isSlot3Locked()) {
            <div class="flex items-center justify-between bg-body-canvas px-space-md py-2 rounded-lg shadow-xs border border-success/30">
              <span class="font-mono-rate text-mono-rate text-voltage-orange font-bold">
                17:30 - 20:00 WIB
              </span>
              <span class="bg-success text-on-primary px-1.5 py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                TERSEDIA
              </span>
            </div>
          } @else {
            <div class="flex items-center justify-between bg-surface-container px-space-md py-2 rounded-lg opacity-60">
              <span class="font-mono-rate text-mono-rate text-ink-secondary line-through">
                17:30 - 20:00 WIB
              </span>
              <span class="bg-surface-variant text-ink-disabled px-1.5 py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                TERKUNCI
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Nearest available slot banner -->
      <div class="bg-whatsapp-surface p-space-md rounded-xl flex items-center justify-between border border-whatsapp-green/20">
        <div class="flex flex-col">
          <span class="font-caption text-caption text-whatsapp-ink font-bold">
            {{ !isSlot3Locked() ? 'Slot Terbuka Publik Terdekat' : 'Semua Slot Besok Penuh / Terkunci' }}
          </span>
          <span class="font-mono-rate text-mono-rate text-whatsapp-ink font-bold">
            {{ !isSlot3Locked() ? 'Besok, 17:30 WIB' : 'Slot Berikutnya: Sabtu, 08:30 WIB' }}
          </span>
        </div>
        <button
          type="button"
          (click)="openPublicSimulation.emit()"
          class="text-whatsapp-ink hover:underline font-caption text-caption font-bold flex items-center gap-0.5 cursor-pointer min-h-[44px] px-2"
          aria-label="Cek simulasi tautan publik"
        >
          <span>Cek Tautan</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePublicPreviewCardComponent {
  readonly workerName = input<string>('Sarah Melinda');
  readonly publicProfileUrl = input<string>('tuwaktu.com/sarah-cleaning');
  readonly isSlot3Locked = input<boolean>(false);

  readonly openPublicSimulation = output<void>();
}
