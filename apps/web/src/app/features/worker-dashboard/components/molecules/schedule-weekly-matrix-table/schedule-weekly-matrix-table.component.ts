import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerScheduleItem } from '../../../models/worker-profile.model';

@Component({
  selector: 'app-schedule-weekly-matrix-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-space-lg">
      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center justify-between flex-wrap gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-primary text-[20px]">date_range</span>
            <h2 class="font-heading-2 text-heading-2 text-primary font-bold">
              Pengaturan Hari Kerja &amp; Jam Operasional Mingguan
            </h2>
          </div>
          <span class="font-caption text-caption text-ink-secondary font-semibold">
            Standar Default Berulang
          </span>
        </div>
        <p class="font-caption text-caption text-ink-secondary">
          Pola kerja mingguan reguler. Saat dinonaktifkan, hari tersebut otomatis bertanda
          <strong class="text-error font-bold">LIBUR MANDIRI</strong> di seluruh antarmuka publik.
        </p>
      </div>

      <!-- Weekly Operational Matrix -->
      <div class="flex flex-col gap-space-xs">
        @for (item of schedules(); track item.day_of_week) {
          <div
            class="p-space-md rounded-xl flex items-center justify-between gap-space-md border transition-all"
            [class.bg-surface-highlight]="item.is_active"
            [class.border-hairline-subtle]="item.is_active"
            [class.bg-error-surface/40]="!item.is_active"
            [class.border-error/20]="!item.is_active"
          >
            <!-- Day Name & Status Badge -->
            <div class="flex items-center gap-space-md min-w-[130px]">
              <span
                class="font-body-strong text-body-strong font-bold"
                [class.text-primary]="item.is_active"
                [class.text-error]="!item.is_active"
              >
                {{ item.day_name }}
              </span>
              @if (item.is_active) {
                @if (item.day_of_week === 6) {
                  <span class="bg-secondary-fixed text-on-secondary-fixed-variant text-micro-uppercase font-micro-uppercase px-1.5 py-0.5 rounded font-bold">
                    Slot Pendek
                  </span>
                } @else {
                  <span class="bg-success-surface text-success text-micro-uppercase font-micro-uppercase px-1.5 py-0.5 rounded font-bold">
                    Aktif
                  </span>
                }
              } @else {
                <span class="bg-error-surface text-error text-micro-uppercase font-micro-uppercase px-1.5 py-0.5 rounded font-bold">
                  Tutup
                </span>
              }
            </div>

            <!-- Hours & Quota Info -->
            <div class="flex items-center gap-space-lg flex-1 justify-center text-center">
              @if (item.is_active) {
                @if (item.day_of_week === 6) {
                  <span class="font-mono-rate text-mono-rate text-primary font-bold">
                    08:30 - 17:00 WIB
                  </span>
                  <span class="font-caption text-caption text-ink-secondary hidden sm:inline">
                    • Kuota Maks 2 Slot
                  </span>
                } @else {
                  <span class="font-mono-rate text-mono-rate text-primary font-bold">
                    08:00 - 20:00 WIB
                  </span>
                  <span class="font-caption text-caption text-ink-secondary hidden sm:inline">
                    • Kuota Maks 3 Slot
                  </span>
                }
              } @else {
                <span class="font-body-strong text-body-strong text-error font-bold">
                  HARI ISTIRAHAT MANDIRI
                </span>
                <span class="font-caption text-caption text-ink-secondary hidden sm:inline">
                  • 0 Slot Dibuka
                </span>
              }
            </div>

            <!-- Toggle Switch -->
            <div class="flex items-center gap-space-md">
              <label class="relative inline-flex items-center cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  [checked]="item.is_active"
                  (change)="toggleDay.emit(item.day_of_week)"
                  class="sr-only peer"
                  [attr.aria-label]="'Ubah status ketersediaan hari ' + item.day_name"
                />
                <div class="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all motion-reduce:animate-none peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        }
      </div>

      <!-- Auto-blocking Lead Time Policy -->
      <div class="bg-surface-highlight p-space-md rounded-xl border border-hairline-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-md">
          <span class="material-symbols-outlined text-ink-secondary text-[22px]">hourglass_top</span>
          <div class="flex flex-col">
            <span class="font-body-strong text-body-strong text-primary font-bold">
              Kebijakan Batas Pemesanan Minimum (Lead Time)
            </span>
            <span class="font-caption text-caption text-ink-secondary">
              Tutup pemesanan otomatis jika waktu order terlalu mendadak agar persiapan logistik tuntas.
            </span>
          </div>
        </div>
        <div class="flex items-center gap-space-xs shrink-0">
          <select
            [value]="leadTimeHours()"
            (change)="onSelectLeadTime($event)"
            class="h-11 px-space-md bg-surface-container-lowest font-body-strong text-body-strong text-primary rounded-lg border border-hairline-subtle shadow-xs focus:outline-none cursor-pointer min-h-[44px]"
            aria-label="Pilih batas pemesanan minimum lead time"
          >
            <option value="3">H-3 Jam Sebelum Slot</option>
            <option value="4">H-4 Jam Sebelum Slot</option>
            <option value="6">H-6 Jam Sebelum Slot</option>
            <option value="24">H-24 Jam (Hari Sebelumnya)</option>
          </select>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleWeeklyMatrixTableComponent {
  readonly schedules = input<WorkerScheduleItem[]>([]);
  readonly leadTimeHours = input<number>(3);

  readonly toggleDay = output<number>();
  readonly leadTimeChange = output<number>();

  onSelectLeadTime(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(val)) {
      this.leadTimeChange.emit(val);
    }
  }
}
