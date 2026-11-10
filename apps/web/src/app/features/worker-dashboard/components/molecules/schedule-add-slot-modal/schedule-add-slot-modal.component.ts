import {
  ChangeDetectionStrategy,
  Component,
  computed,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SlotDateOption {
  readonly dayLabel: string;
  readonly dateFormatted: string;
  readonly fullDateText: string;
  readonly isoDate: string;
  readonly isToday: boolean;
  readonly isTomorrow: boolean;
}

export interface SlotDurationOption {
  readonly label: string;
  readonly minutes: number;
}

export interface AddSlotPayload {
  readonly date: string;
  readonly rawDate: string;
  readonly start: string;
  readonly end: string;
  readonly durationMinutes: number;
}

function calculateEndTime(startTime: string, minutesToAdd: number): string {
  const [hStr, mStr] = startTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  const totalMin = h * 60 + m + minutesToAdd;
  const finalH = Math.floor(totalMin / 60) % 24;
  const finalM = totalMin % 60;

  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

function generateNext7Days(): SlotDateOption[] {
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const fullDays = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
  ];

  const result: SlotDateOption[] = [];
  const baseDate = new Date();

  for (let i = 0; i < 7; i++) {
    const current = new Date(baseDate);
    current.setDate(baseDate.getDate() + i);

    const dayIndex = current.getDay();
    const dateNum = current.getDate();
    const monthStr = months[current.getMonth()];
    const year = current.getFullYear();

    const isToday = i === 0;
    const isTomorrow = i === 1;
    const dayLabel = isToday
      ? 'Hari Ini'
      : isTomorrow
        ? 'Besok'
        : daysOfWeek[dayIndex];
    const fullDateText = `${fullDays[dayIndex]}, ${dateNum} ${monthStr} ${year}`;
    const isoDate = `${year}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

    result.push({
      dayLabel,
      dateFormatted: `${dateNum} ${monthStr}`,
      fullDateText,
      isoDate,
      isToday,
      isTomorrow,
    });
  }
  return result;
}

@Component({
  selector: 'app-schedule-add-slot-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addSlotModalTitle"
    >
      <div
        class="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl border border-hairline-subtle"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-hairline-subtle">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-voltage-orange/10 text-voltage-orange flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[20px]">more_time</span>
            </div>
            <div>
              <h3 id="addSlotModalTitle" class="font-heading-3 text-heading-3 text-primary font-bold">
                Buka Slot Tambahan / Lembur
              </h3>
              <p class="font-caption text-caption text-ink-secondary">
                Pilih tanggal dan durasi terverifikasi tanpa input teks manual
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="p-2 text-ink-secondary hover:text-primary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup Tambah Slot"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Step 1: Kalender Mini Visual Mingguan (7 Hari) -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-primary block">
              1. Pilih Tanggal Slot (7 Hari ke Depan)
            </label>
            <div
              class="grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto pb-1"
              role="radiogroup"
              aria-label="Pilihan Tanggal Slot"
            >
              @for (dateOpt of availableDates; track dateOpt.isoDate) {
                <button
                  type="button"
                  (click)="selectedDateOption.set(dateOpt)"
                  class="flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer min-h-[56px] text-center"
                  [class.bg-voltage-orange]="selectedDateOption().isoDate === dateOpt.isoDate"
                  [class.text-white]="selectedDateOption().isoDate === dateOpt.isoDate"
                  [class.border-voltage-orange]="selectedDateOption().isoDate === dateOpt.isoDate"
                  [class.shadow-xs]="selectedDateOption().isoDate === dateOpt.isoDate"
                  [class.bg-surface-highlight]="selectedDateOption().isoDate !== dateOpt.isoDate"
                  [class.border-hairline-subtle]="selectedDateOption().isoDate !== dateOpt.isoDate"
                  [class.text-primary]="selectedDateOption().isoDate !== dateOpt.isoDate"
                  [class.hover:border-voltage-orange/60]="selectedDateOption().isoDate !== dateOpt.isoDate"
                  [attr.aria-checked]="selectedDateOption().isoDate === dateOpt.isoDate"
                  [attr.data-testid]="'slot-date-btn-' + dateOpt.isoDate"
                >
                  <span class="text-[11px] font-bold uppercase tracking-wider block">
                    {{ dateOpt.dayLabel }}
                  </span>
                  <span class="text-xs font-mono font-medium block mt-0.5">
                    {{ dateOpt.dateFormatted }}
                  </span>
                </button>
              }
            </div>
          </div>

          <!-- Step 2: Segmented Jam Mulai -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-primary block">
              2. Jam Mulai Lembur (WIB)
            </label>
            <div
              class="grid grid-cols-3 sm:grid-cols-5 gap-2"
              role="radiogroup"
              aria-label="Pilihan Jam Mulai"
            >
              @for (startTime of startTimeOptions; track startTime) {
                <button
                  type="button"
                  (click)="selectedStartTime.set(startTime)"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                  [class.bg-primary]="selectedStartTime() === startTime"
                  [class.text-on-primary]="selectedStartTime() === startTime"
                  [class.border-primary]="selectedStartTime() === startTime"
                  [class.shadow-xs]="selectedStartTime() === startTime"
                  [class.bg-surface-highlight]="selectedStartTime() !== startTime"
                  [class.border-hairline-subtle]="selectedStartTime() !== startTime"
                  [class.text-primary]="selectedStartTime() !== startTime"
                  [class.hover:border-primary/50]="selectedStartTime() !== startTime"
                  [attr.aria-checked]="selectedStartTime() === startTime"
                  [attr.data-testid]="'slot-start-time-' + startTime.replace(':', '')"
                >
                  {{ startTime }}
                </button>
              }
            </div>
          </div>

          <!-- Step 3: Segmented Durasi -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-primary block">
              3. Durasi Slot
            </label>
            <div
              class="grid grid-cols-2 sm:grid-cols-4 gap-2"
              role="radiogroup"
              aria-label="Pilihan Durasi"
            >
              @for (durationOpt of durationOptions; track durationOpt.label) {
                <button
                  type="button"
                  (click)="selectedDuration.set(durationOpt)"
                  class="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                  [class.bg-primary]="selectedDuration().label === durationOpt.label"
                  [class.text-on-primary]="selectedDuration().label === durationOpt.label"
                  [class.border-primary]="selectedDuration().label === durationOpt.label"
                  [class.shadow-xs]="selectedDuration().label === durationOpt.label"
                  [class.bg-surface-highlight]="selectedDuration().label !== durationOpt.label"
                  [class.border-hairline-subtle]="selectedDuration().label !== durationOpt.label"
                  [class.text-primary]="selectedDuration().label !== durationOpt.label"
                  [class.hover:border-primary/50]="selectedDuration().label !== durationOpt.label"
                  [attr.aria-checked]="selectedDuration().label === durationOpt.label"
                  [attr.data-testid]="'slot-duration-' + durationOpt.minutes"
                >
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{{ durationOpt.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Step 4: Live Preview Ringkasan Slot Terpilih -->
          <div
            class="p-4 bg-surface-highlight rounded-xl border border-hairline-subtle space-y-2 text-xs"
            data-testid="slot-summary-card"
          >
            <div class="flex items-center justify-between text-primary font-bold">
              <span class="flex items-center gap-1.5 text-xs text-voltage-orange">
                <span class="material-symbols-outlined text-base">event_available</span>
                Pratinjau Slot Terpilih
              </span>
              <span class="font-mono bg-voltage-orange/15 text-voltage-orange px-2 py-0.5 rounded text-[11px]">
                {{ selectedDuration().label }} Operasional
              </span>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-primary">
              <span class="font-medium">
                {{ selectedDateOption().fullDateText }}
              </span>
              <span class="font-mono font-bold text-sm text-primary">
                {{ selectedStartTime() }} - {{ calculatedEndTime() }} WIB
              </span>
            </div>

            <div class="pt-2 border-t border-hairline-subtle flex items-start gap-2 text-ink-secondary text-[11px]">
              <span class="material-symbols-outlined text-promo-ink text-sm shrink-0 mt-0.5">info</span>
              <p>
                Buffer transit pemulihan 90 menit otomatis aktif setelah slot selesai (siap siaga s.d.
                <strong class="text-primary font-mono">{{ calculatedBufferEndTime() }} WIB</strong>).
              </p>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="pt-4 border-t border-hairline-subtle flex justify-end gap-3">
            <button
              type="button"
              (click)="dismissModal.emit()"
              class="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-button-label text-button-label hover:bg-surface-variant transition-colors cursor-pointer min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              data-testid="submit-add-slot-btn"
              class="px-5 py-2.5 rounded-lg bg-voltage-orange text-white font-button-label text-button-label hover:bg-orange-600 transition-colors shadow-xs cursor-pointer min-h-[44px] flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Buka Slot Tambahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleAddSlotModalComponent {
  readonly availableDates: readonly SlotDateOption[] = generateNext7Days();
  readonly startTimeOptions: readonly string[] = [
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
  ];
  readonly durationOptions: readonly SlotDurationOption[] = [
    { label: '1 Jam', minutes: 60 },
    { label: '1.5 Jam', minutes: 90 },
    { label: '2 Jam', minutes: 120 },
    { label: '2.5 Jam', minutes: 150 },
  ];

  // Default: Besok (indeks 1 jika ada, atau indeks 0), Jam 20:00, Durasi 2 Jam (120 min)
  readonly selectedDateOption = signal<SlotDateOption>(
    this.availableDates[1] || this.availableDates[0],
  );
  readonly selectedStartTime = signal<string>('20:00');
  readonly selectedDuration = signal<SlotDurationOption>(
    this.durationOptions[2], // 2 Jam
  );

  readonly calculatedEndTime = computed(() => {
    return calculateEndTime(
      this.selectedStartTime(),
      this.selectedDuration().minutes,
    );
  });

  readonly calculatedBufferEndTime = computed(() => {
    return calculateEndTime(this.calculatedEndTime(), 90);
  });

  readonly dismissModal = output<void>();
  readonly slotSaved = output<AddSlotPayload>();

  onSubmit(): void {
    const selectedDate = this.selectedDateOption();
    this.slotSaved.emit({
      date: selectedDate.fullDateText,
      rawDate: selectedDate.isoDate,
      start: this.selectedStartTime(),
      end: this.calculatedEndTime(),
      durationMinutes: this.selectedDuration().minutes,
    });
    this.dismissModal.emit();
  }
}
