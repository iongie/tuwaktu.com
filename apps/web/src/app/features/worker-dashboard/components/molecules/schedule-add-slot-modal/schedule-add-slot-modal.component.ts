import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-schedule-add-slot-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addSlotModalTitle"
    >
      <div
        class="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl border border-hairline-subtle"
      >
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
                Tambahkan jendela waktu khusus di luar jam operasional reguler
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

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="space-y-1.5">
            <label for="slotDate" class="text-xs font-bold text-primary block">Tanggal Slot</label>
            <input
              id="slotDate"
              type="text"
              [value]="slotDate()"
              (input)="slotDate.set($any($event.target).value)"
              class="w-full px-3 py-2 text-sm bg-surface-highlight border border-hairline-subtle rounded-lg focus:outline-none focus:border-voltage-orange"
              placeholder="Contoh: Besok (25 Okt)"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label for="startTime" class="text-xs font-bold text-primary block">Jam Mulai</label>
              <input
                id="startTime"
                type="text"
                [value]="startTime()"
                (input)="startTime.set($any($event.target).value)"
                class="w-full px-3 py-2 text-sm bg-surface-highlight border border-hairline-subtle rounded-lg focus:outline-none focus:border-voltage-orange font-mono"
                placeholder="20:00"
              />
            </div>
            <div class="space-y-1.5">
              <label for="endTime" class="text-xs font-bold text-primary block">Jam Selesai</label>
              <input
                id="endTime"
                type="text"
                [value]="endTime()"
                (input)="endTime.set($any($event.target).value)"
                class="w-full px-3 py-2 text-sm bg-surface-highlight border border-hairline-subtle rounded-lg focus:outline-none focus:border-voltage-orange font-mono"
                placeholder="22:30"
              />
            </div>
          </div>

          <div class="p-3 bg-surface-warm-promo rounded-xl border border-promo-ink/10 text-xs flex items-start gap-2">
            <span class="material-symbols-outlined text-promo-ink text-base shrink-0 mt-0.5">info</span>
            <p class="text-promo-ink">
              Proteksi buffer transit 90 menit akan otomatis ditambahkan setelah jam selesai slot lembur ini.
            </p>
          </div>

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
              class="px-5 py-2.5 rounded-lg bg-voltage-orange text-white font-button-label text-button-label hover:bg-orange-600 transition-colors shadow-xs cursor-pointer min-h-[44px]"
            >
              Simpan &amp; Buka Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleAddSlotModalComponent {
  readonly slotDate = signal<string>('Besok (25 Okt)');
  readonly startTime = signal<string>('20:00');
  readonly endTime = signal<string>('22:30');

  readonly dismissModal = output<void>();
  readonly slotSaved = output<{ date: string; start: string; end: string }>();

  onSubmit(): void {
    this.slotSaved.emit({
      date: this.slotDate(),
      start: this.startTime(),
      end: this.endTime(),
    });
    this.dismissModal.emit();
  }
}
