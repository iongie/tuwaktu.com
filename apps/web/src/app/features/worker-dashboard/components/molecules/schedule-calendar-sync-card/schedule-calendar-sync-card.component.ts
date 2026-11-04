import { ChangeDetectionStrategy, Component, input, OnDestroy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-calendar-sync-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-space-lg">
      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center justify-between">
          <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold tracking-wider">
            INTEGRASI KALENDER
          </span>
          <span class="bg-success-surface text-success text-micro-uppercase font-micro-uppercase px-2 py-0.5 rounded font-bold border border-success/20">
            2-Way Sync
          </span>
        </div>
        <h3 class="font-heading-3 text-heading-3 text-primary font-bold">
          Ekspor &amp; Sinkronisasi Kalender
        </h3>
        <p class="font-caption text-caption text-ink-secondary">
          Hubungkan dengan agenda ponsel Anda agar slot tidak bentrok dengan urusan pribadi.
        </p>
      </div>

      <!-- Google Calendar Channel -->
      <div class="bg-surface-highlight p-space-md rounded-xl border border-hairline-subtle flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-md">
          <div class="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center font-bold text-primary shadow-xs border border-hairline-subtle shrink-0">
            <span class="material-symbols-outlined text-[20px]">sync</span>
          </div>
          <div class="flex flex-col">
            <span class="font-body-strong text-body-strong text-primary font-bold">
              Google Calendar
            </span>
            <span class="font-caption text-caption text-success font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
              Terhubung (Sync tiap 5 menit)
            </span>
          </div>
        </div>
        <button
          type="button"
          (click)="manageGoogleSync.emit()"
          class="text-caption text-ink-secondary hover:text-primary font-button-label underline cursor-pointer min-h-[44px] px-2 flex items-center"
        >
          Kelola
        </button>
      </div>

      <!-- iCal WebCal Feed Container -->
      <div class="flex flex-col gap-space-xs">
        <label for="webcalUrlInput" class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold tracking-wider">
          URL FEED WEBCAL (APPLE ICAL / OUTLOOK)
        </label>
        <div class="flex items-center gap-space-xs bg-surface-highlight p-1.5 rounded-xl border border-hairline-subtle">
          <input
            id="webcalUrlInput"
            type="text"
            [value]="webcalUrl()"
            readonly
            class="bg-transparent font-mono-rate text-mono-rate text-ink-secondary w-full px-space-xs focus:outline-none select-all text-xs"
            aria-label="URL Feed WebCal"
          />
          <button
            type="button"
            (click)="copyWebCalUrl()"
            class="px-space-md py-2 bg-surface-container-lowest hover:bg-surface-container text-primary rounded-lg font-button-label text-caption shrink-0 transition-colors shadow-xs border border-hairline-subtle cursor-pointer min-h-[44px] flex items-center gap-1"
          >
            @if (isCopied()) {
              <span class="material-symbols-outlined text-[16px] text-success">check</span>
              <span class="text-success font-bold">Tersalin ✓</span>
            } @else {
              <span class="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Salin URL</span>
            }
          </button>
        </div>
      </div>

      <!-- Google Personal Sync Auto-Block Switch -->
      <div class="p-space-md bg-surface-highlight rounded-xl border border-hairline-subtle flex items-start justify-between gap-space-md">
        <div class="flex flex-col">
          <span class="font-body-strong text-body-strong text-primary font-bold">
            Blokir Otomatis Jika Ada Agenda Pribadi
          </span>
          <span class="font-caption text-caption text-ink-secondary">
            Jika Anda menjadwalkan dokter atau urusan keluarga di Google Calendar, slot Tuwaktu pada jam tersebut otomatis terkunci publik.
          </span>
        </div>
        <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1 min-h-[44px]">
          <input
            type="checkbox"
            [checked]="autoBlockAgenda()"
            (change)="toggleAutoBlock.emit()"
            class="sr-only peer"
            aria-label="Blokir otomatis jika ada agenda pribadi"
          />
          <div class="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all motion-reduce:animate-none peer-checked:bg-voltage-orange"></div>
        </label>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCalendarSyncCardComponent implements OnDestroy {
  readonly webcalUrl = input<string>('webcal://tuwaktu.com/feed/cal/c8f29e10');
  readonly autoBlockAgenda = input<boolean>(true);

  readonly toggleAutoBlock = output<void>();
  readonly manageGoogleSync = output<void>();

  readonly isCopied = signal<boolean>(false);
  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  async copyWebCalUrl(): Promise<void> {
    const text = this.webcalUrl();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Fallback
    }

    this.isCopied.set(true);
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
    this.copyTimeout = setTimeout(() => {
      this.isCopied.set(false);
      this.copyTimeout = null;
    }, 2500);

    const timerObj = this.copyTimeout as unknown;
    if (
      timerObj &&
      typeof timerObj === 'object' &&
      'unref' in timerObj &&
      typeof (timerObj as { unref: () => void }).unref === 'function'
    ) {
      (timerObj as { unref: () => void }).unref();
    }
  }

  ngOnDestroy(): void {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
      this.copyTimeout = null;
    }
  }
}
