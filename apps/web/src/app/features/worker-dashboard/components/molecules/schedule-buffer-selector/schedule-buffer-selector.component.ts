import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-buffer-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-space-lg">
      <div class="flex items-start justify-between flex-wrap gap-space-sm">
        <div class="flex flex-col gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-voltage-orange text-[20px]">timer</span>
            <h2 class="font-heading-2 text-heading-2 text-primary font-bold">
              Aturan Proteksi Jeda Wajib (Transit &amp; Rest Buffer)
            </h2>
          </div>
          <p class="font-caption text-caption text-ink-secondary">
            Parameter matematis yang mengunci jeda di antara pesanan masuk.
          </p>
        </div>
        <span class="bg-secondary-fixed text-on-secondary-fixed-variant px-space-sm py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
          OTOMATIS SISTEM
        </span>
      </div>

      <!-- Educational Philosophy Callout -->
      <div class="bg-surface-warm-promo p-space-md rounded-lg flex items-start gap-space-md border border-promo-ink/10">
        <span class="material-symbols-outlined text-promo-ink text-[22px] shrink-0 mt-0.5">info</span>
        <div class="flex flex-col gap-0.5">
          <span class="font-body-strong text-body-strong text-promo-ink font-bold">
            Mengapa Buffer Wajib Diaktifkan?
          </span>
          <p class="font-caption text-caption text-promo-ink/90 leading-relaxed">
            Sistem secara otomatis mengunci jeda waktu pasca order selesai untuk sterilisasi alat, perjalanan bermotor, dan istirahat agar pekerja tiba tepat waktu di lokasi berikutnya tanpa kelelahan. Klien publik tidak dapat memesan jam dalam rentang ini.
          </p>
        </div>
      </div>

      <!-- Buffer Duration Selectors -->
      <div class="flex flex-col gap-space-sm">
        <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold tracking-wider block">
          DURASI JEDA MINIMUM ANTAR ORDER
        </span>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          <!-- 60 Min Option -->
          <label
            class="cursor-pointer transition-all p-space-md rounded-xl flex flex-col gap-space-xs border min-h-[44px]"
            [class.bg-surface-container-lowest]="selectedBufferMinutes() === 60"
            [class.border-voltage-orange]="selectedBufferMinutes() === 60"
            [class.shadow-xs]="selectedBufferMinutes() === 60"
            [class.bg-surface-highlight]="selectedBufferMinutes() !== 60"
            [class.border-transparent]="selectedBufferMinutes() !== 60"
            [class.hover:bg-surface-container]="selectedBufferMinutes() !== 60"
          >
            <div class="flex items-center justify-between">
              <span class="font-body-strong text-body-strong text-primary">60 Menit</span>
              <input
                type="radio"
                name="transit_buffer"
                value="60"
                [checked]="selectedBufferMinutes() === 60"
                (change)="bufferMinutesChange.emit(60)"
                class="accent-voltage-orange w-4 h-4 cursor-pointer"
              />
            </div>
            <span class="font-caption text-caption text-ink-secondary">
              Radius mikro (&lt; 5 km), rute dekat perumahan.
            </span>
          </label>

          <!-- 90 Min (Recommended) -->
          <label
            class="cursor-pointer transition-all p-space-md rounded-xl flex flex-col gap-space-xs border min-h-[44px]"
            [class.bg-surface-container-lowest]="selectedBufferMinutes() === 90"
            [class.border-voltage-orange]="selectedBufferMinutes() === 90"
            [class.shadow-sm]="selectedBufferMinutes() === 90"
            [class.bg-surface-highlight]="selectedBufferMinutes() !== 90"
            [class.border-transparent]="selectedBufferMinutes() !== 90"
            [class.hover:bg-surface-container]="selectedBufferMinutes() !== 90"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <span class="font-body-strong text-body-strong text-primary">90 Menit</span>
                <span class="text-success material-symbols-outlined text-[16px]">check_circle</span>
              </div>
              <input
                type="radio"
                name="transit_buffer"
                value="90"
                [checked]="selectedBufferMinutes() === 90"
                (change)="bufferMinutesChange.emit(90)"
                class="accent-voltage-orange w-4 h-4 cursor-pointer"
              />
            </div>
            <span class="font-caption text-caption text-voltage-orange font-bold">
              Direkomendasikan Tuwaktu
            </span>
            <span class="font-caption text-caption text-ink-secondary">
              Waktu ideal: 40m transit macet + 30m sterilisasi + 20m istirahat hidrasi.
            </span>
          </label>

          <!-- 120 Min Option -->
          <label
            class="cursor-pointer transition-all p-space-md rounded-xl flex flex-col gap-space-xs border min-h-[44px]"
            [class.bg-surface-container-lowest]="selectedBufferMinutes() === 120"
            [class.border-voltage-orange]="selectedBufferMinutes() === 120"
            [class.shadow-xs]="selectedBufferMinutes() === 120"
            [class.bg-surface-highlight]="selectedBufferMinutes() !== 120"
            [class.border-transparent]="selectedBufferMinutes() !== 120"
            [class.hover:bg-surface-container]="selectedBufferMinutes() !== 120"
          >
            <div class="flex items-center justify-between">
              <span class="font-body-strong text-body-strong text-primary">120 Menit</span>
              <input
                type="radio"
                name="transit_buffer"
                value="120"
                [checked]="selectedBufferMinutes() === 120"
                (change)="bufferMinutesChange.emit(120)"
                class="accent-voltage-orange w-4 h-4 cursor-pointer"
              />
            </div>
            <span class="font-caption text-caption text-ink-secondary">
              Lintas kota (&gt; 15 km) &amp; cuci peralatan berat.
            </span>
          </label>
        </div>
      </div>

      <!-- Dynamic Rule Toggles -->
      <div class="flex flex-col gap-space-sm pt-space-xs border-t border-hairline-subtle">
        <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold tracking-wider block">
          PROTEKSI CERDAS &amp; REST HOURS
        </span>
        <div class="flex flex-col gap-space-sm">
          <!-- Traffic peak hour toggle -->
          <div class="flex items-center justify-between p-space-md bg-surface-highlight rounded-xl border border-hairline-subtle gap-space-md">
            <div class="flex items-start gap-space-md">
              <span class="material-symbols-outlined text-ink-secondary text-[20px] mt-0.5">traffic</span>
              <div class="flex flex-col">
                <span class="font-body-strong text-body-strong text-primary">
                  Otomatis tambah +15 menit buffer pada jam sibuk (16:30 - 18:30 WIB)
                </span>
                <span class="font-caption text-caption text-ink-secondary">
                  Mengantisipasi hambatan lalu lintas sore Jakarta Selatan &amp; Pusat secara dinamis.
                </span>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-space-md min-h-[44px]">
              <input
                type="checkbox"
                [checked]="autoPeakHourBuffer()"
                (change)="togglePeakHour.emit()"
                class="sr-only peer"
                aria-label="Aktifkan buffer jam sibuk otomatis"
              />
              <div class="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all motion-reduce:animate-none peer-checked:bg-voltage-orange"></div>
            </label>
          </div>

          <!-- Mandatory lunch break toggle -->
          <div class="flex items-center justify-between p-space-md bg-surface-highlight rounded-xl border border-hairline-subtle gap-space-md">
            <div class="flex items-start gap-space-md">
              <span class="material-symbols-outlined text-ink-secondary text-[20px] mt-0.5">restaurant</span>
              <div class="flex flex-col">
                <span class="font-body-strong text-body-strong text-primary">
                  Kunci jeda makan siang mandiri wajib 45 menit (11:45 - 12:30 WIB)
                </span>
                <span class="font-caption text-caption text-ink-secondary">
                  Slot istirahat makan siang tidak dapat di-override oleh pesanan masuk jenis apapun.
                </span>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-space-md min-h-[44px]">
              <input
                type="checkbox"
                [checked]="mandatoryLunchBreak()"
                (change)="toggleLunchBreak.emit()"
                class="sr-only peer"
                aria-label="Kunci jeda makan siang mandiri wajib"
              />
              <div class="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all motion-reduce:animate-none peer-checked:bg-voltage-orange"></div>
            </label>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBufferSelectorComponent {
  readonly selectedBufferMinutes = input<number>(90);
  readonly autoPeakHourBuffer = input<boolean>(true);
  readonly mandatoryLunchBreak = input<boolean>(true);

  readonly bufferMinutesChange = output<number>();
  readonly togglePeakHour = output<void>();
  readonly toggleLunchBreak = output<void>();
}
