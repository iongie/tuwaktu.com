import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerScheduleItem } from '../../../models/worker-profile.model';

export interface ScheduleSlotBooking {
  readonly id: string;
  readonly slotNumber: '01' | '02' | '03';
  readonly clientName: string;
  readonly serviceName: string;
  readonly timeRange: string;
  readonly durationText: string;
  readonly clientLocation: string;
  readonly statusText: string;
  readonly statusBadge: string;
  readonly departureEstimate?: string;
  readonly orderId: string;
}

export interface CalendarMonthDay {
  readonly date: Date;
  readonly dayNumber: number;
  readonly isoDate: string; // 'YYYY-MM-DD'
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly dayOfWeek: number; // 0=Min, 1=Sen, ... 6=Sab
}

@Component({
  selector: 'app-schedule-slot-timeline-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-space-lg">
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-sm border-b border-hairline-subtle">
        <div class="flex flex-col gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
            <h2 class="font-heading-2 text-heading-2 text-primary font-bold">
              Kalender Kerja &amp; Ketersediaan Slot
            </h2>
          </div>
          <span class="font-caption text-caption text-ink-secondary">
            Pilih tanggal di kalender untuk mengatur hari libur khusus atau menutup slot tertentu.
          </span>
        </div>

        <!-- Quick Today Button -->
        <button
          type="button"
          (click)="goToToday()"
          class="px-space-md py-space-xs font-button-label text-button-label rounded-lg transition-colors border border-hairline-subtle hover:bg-surface-container text-primary min-h-[44px] flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px]">today</span>
          <span>Hari Ini</span>
        </button>
      </div>

      <!-- KALENDER GRID BULANAN PENUH -->
      <div class="bg-surface-highlight p-space-md rounded-xl border border-hairline-subtle flex flex-col gap-space-md">
        <!-- Month Navigator -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-heading-3 text-heading-3 text-primary font-bold">
              {{ currentMonthName() }} {{ currentYear() }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              (click)="previousMonth()"
              class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-surface-container text-primary transition-colors cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <span class="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              type="button"
              (click)="nextMonth()"
              class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-surface-container text-primary transition-colors cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <span class="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- Weekday Headers (Senin s.d. Minggu) -->
        <div class="grid grid-cols-7 gap-1 text-center">
          @for (dayName of weekDayHeaders; track dayName) {
            <span class="text-[11px] font-bold text-ink-secondary uppercase tracking-wider py-1 font-mono-rate">
              {{ dayName }}
            </span>
          }
        </div>

        <!-- Month Days Grid -->
        <div class="grid grid-cols-7 gap-1 sm:gap-1.5">
          @for (cell of calendarDays(); track cell.isoDate) {
            <button
              type="button"
              (click)="selectCalendarDate(cell.date)"
              class="min-h-[48px] sm:min-h-[54px] p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer relative"
              [class.opacity-30]="!cell.isCurrentMonth"
              [class.bg-voltage-orange]="isDateSelected(cell.isoDate)"
              [class.text-white]="isDateSelected(cell.isoDate)"
              [class.border-voltage-orange]="isDateSelected(cell.isoDate)"
              [class.shadow-xs]="isDateSelected(cell.isoDate)"
              [class.bg-surface-container-lowest]="!isDateSelected(cell.isoDate) && cell.isCurrentMonth"
              [class.border-hairline-subtle]="!isDateSelected(cell.isoDate)"
              [class.hover:border-voltage-orange/60]="!isDateSelected(cell.isoDate)"
              [attr.aria-selected]="isDateSelected(cell.isoDate)"
              [attr.data-testid]="'calendar-day-' + cell.isoDate"
            >
              <div class="flex items-center justify-between w-full">
                <span
                  class="text-xs font-mono font-bold"
                  [class.text-white]="isDateSelected(cell.isoDate)"
                  [class.text-primary]="!isDateSelected(cell.isoDate)"
                >
                  {{ cell.dayNumber }}
                </span>
                @if (cell.isToday) {
                  <span
                    class="text-[9px] font-bold px-1 rounded uppercase tracking-wider"
                    [class.bg-white]="isDateSelected(cell.isoDate)"
                    [class.text-voltage-orange]="isDateSelected(cell.isoDate)"
                    [class.bg-voltage-orange/15]="!isDateSelected(cell.isoDate)"
                    [class.text-voltage-orange]="!isDateSelected(cell.isoDate)"
                  >
                    Hari Ini
                  </span>
                }
              </div>

              <!-- Status Indicators dot / text -->
              <div class="flex items-center gap-1 mt-1">
                @if (isSpecialHoliday(cell.isoDate)) {
                  <span
                    class="text-[10px] font-semibold px-1 rounded truncate max-w-full"
                    [class.bg-red-500]="isDateSelected(cell.isoDate)"
                    [class.text-white]="isDateSelected(cell.isoDate)"
                    [class.bg-error-surface]="!isDateSelected(cell.isoDate)"
                    [class.text-error]="!isDateSelected(cell.isoDate)"
                  >
                    Cuti/Libur
                  </span>
                } @else if (isWeeklyDayOff(cell.dayOfWeek)) {
                  <span
                    class="text-[10px] font-semibold px-1 rounded truncate max-w-full opacity-70"
                    [class.text-white]="isDateSelected(cell.isoDate)"
                    [class.text-ink-secondary]="!isDateSelected(cell.isoDate)"
                  >
                    Libur Rutin
                  </span>
                } @else {
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [class.bg-white]="isDateSelected(cell.isoDate)"
                    [class.bg-success]="!isDateSelected(cell.isoDate)"
                    title="Operasional Aktif"
                  ></span>
                }
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Panel Tanggal Terpilih & Kontrol Libur Khusus -->
      <div class="p-space-md rounded-xl bg-surface-highlight border border-hairline-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-md">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold"
            [class.bg-error-surface]="isCurrentDateHoliday()"
            [class.text-error]="isCurrentDateHoliday()"
            [class.bg-success-surface]="!isCurrentDateHoliday()"
            [class.text-success]="!isCurrentDateHoliday()"
          >
            <span class="material-symbols-outlined text-[24px]">
              {{ isCurrentDateHoliday() ? 'event_busy' : 'event_available' }}
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-mono font-bold text-ink-secondary uppercase tracking-wider">
              Tanggal Operasional Terpilih
            </span>
            <span class="font-heading-3 text-heading-3 text-primary font-bold">
              {{ selectedDateFormatted() }}
            </span>
            <span class="font-caption text-caption text-ink-secondary">
              @if (isCurrentDateHoliday()) {
                Status: <strong class="text-error">Libur / Tidak Menerima Pemesanan Publik</strong>
              } @else {
                Status: <strong class="text-success">Aktif Siap Menerima Pemesanan</strong>
              }
            </span>
          </div>
        </div>

        <!-- Tombol Aksi Toggle Libur Tanggal Ini -->
        <button
          type="button"
          (click)="handleToggleHoliday()"
          class="flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg transition-colors shadow-xs font-button-label text-button-label cursor-pointer min-h-[44px]"
          [class.bg-error]="!isCurrentDateHoliday()"
          [class.text-on-error]="!isCurrentDateHoliday()"
          [class.hover:bg-error-dark]="!isCurrentDateHoliday()"
          [class.bg-success]="isCurrentDateHoliday()"
          [class.text-on-primary]="isCurrentDateHoliday()"
          [class.hover:bg-emerald-700]="isCurrentDateHoliday()"
          data-testid="toggle-date-holiday-btn"
        >
          <span class="material-symbols-outlined text-[18px]">
            {{ isCurrentDateHoliday() ? 'lock_open' : 'event_busy' }}
          </span>
          <span>
            {{ isCurrentDateHoliday() ? 'Buka Operasional Tanggal Ini' : 'Tandai Libur Tanggal Ini' }}
          </span>
        </button>
      </div>

      <!-- Capacity Utilization Metric Bar -->
      <div class="bg-surface-highlight p-space-md rounded-xl border border-hairline-subtle flex flex-col gap-space-xs">
        <div class="flex items-center justify-between text-body-strong flex-wrap gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="font-body-strong text-body-strong text-primary">Kapasitas Hari Ini:</span>
            <span
              class="font-mono-rate text-mono-rate font-bold"
              [class.text-success]="!isCurrentDateHoliday()"
              [class.text-error]="isCurrentDateHoliday()"
            >
              {{ capacityMetricText() }}
            </span>
          </div>
          <span class="font-caption text-caption text-ink-secondary">{{ capacitySubText() }}</span>
        </div>
        <div class="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden flex" role="progressbar" aria-valuenow="67" aria-valuemin="0" aria-valuemax="100">
          @if (isCurrentDateHoliday()) {
            <div class="bg-error h-full w-full" title="Hari Libur"></div>
          } @else {
            <div
              [class.bg-primary]="slot1Booking()"
              [class.bg-neutral-500]="!slot1Booking() && isSlot1Locked()"
              [class.bg-success-surface]="!slot1Booking() && !isSlot1Locked()"
              class="h-full w-[33.3%]"
              title="Slot 01: Pagi"
            ></div>
            <div
              [class.bg-voltage-orange]="slot2Booking()"
              [class.bg-neutral-500]="!slot2Booking() && isSlot2Locked()"
              [class.bg-success-surface]="!slot2Booking() && !isSlot2Locked()"
              class="h-full w-[33.3%] border-l border-white/40"
              title="Slot 02: Siang"
            ></div>
            <div
              [class.bg-secondary]="slot3Booking()"
              [class.bg-neutral-500]="!slot3Booking() && isSlot3Locked()"
              [class.bg-success-surface]="!slot3Booking() && !isSlot3Locked()"
              class="h-full w-[33.4%] border-l border-white/40"
              title="Slot 03: Sore"
            ></div>
          }
        </div>
      </div>

      <!-- Interactive Time Block List -->
      <div class="flex flex-col gap-space-md">
        @if (isCurrentDateHoliday()) {
          <!-- Empty State Hari Libur Terjadwal -->
          <div class="p-space-xl rounded-xl bg-surface-highlight border border-hairline-subtle flex flex-col items-center justify-center text-center gap-space-sm py-12">
            <div class="w-12 h-12 rounded-xl bg-error-surface text-error flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-[28px]">do_not_disturb_on</span>
            </div>
            <span class="font-heading-3 text-heading-3 text-primary font-bold">
              Hari Libur Terjadwal
            </span>
            <p class="font-caption text-caption text-ink-secondary max-w-md leading-relaxed">
              Seluruh slot pemesanan publik pada tanggal ini dinonaktifkan. Klien tidak dapat memilih jadwal pada tanggal ini.
            </p>
            <button
              type="button"
              (click)="handleToggleHoliday()"
              class="mt-2 flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest hover:bg-surface-container text-primary font-button-label text-button-label rounded-lg transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[18px]">lock_open</span>
              <span>Buka Operasional Khusus Hari Ini</span>
            </button>
          </div>
        } @else {
          <!-- SLOT 1 (PAGI) -->
          @if (slot1Booking(); as booking1) {
            <div class="bg-surface-highlight p-space-lg rounded-xl border border-hairline-subtle flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div class="flex items-start gap-space-md">
                <div class="w-12 h-12 bg-primary text-on-primary rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">01</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span class="font-mono-rate text-mono-rate text-primary font-bold">{{ booking1.timeRange }}</span>
                    <span class="font-caption text-caption text-ink-secondary">({{ booking1.durationText }})</span>
                    <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      {{ booking1.statusBadge }}
                    </span>
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ booking1.serviceName }} • {{ booking1.clientName }}
                  </span>
                  <div class="flex items-center gap-space-xs text-caption text-ink-secondary flex-wrap">
                    <span class="material-symbols-outlined text-[14px]">pin_drop</span>
                    <span>{{ booking1.clientLocation }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                <button
                  type="button"
                  (click)="viewOrderDetails.emit(booking1.orderId)"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Rincian Order
                </button>
              </div>
            </div>
          } @else {
            <!-- Slot 1 Available or Locked -->
            <div
              class="p-space-lg rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-colors"
              [class.bg-success-surface]="!isSlot1Locked()"
              [class.border-success/30]="!isSlot1Locked()"
              [class.bg-surface-container]="isSlot1Locked()"
              [class.border-hairline-subtle]="isSlot1Locked()"
            >
              <div class="flex items-start gap-space-md">
                <div
                  class="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                  [class.bg-success]="!isSlot1Locked()"
                  [class.text-on-primary]="!isSlot1Locked()"
                  [class.bg-neutral-600]="isSlot1Locked()"
                  [class.text-white]="isSlot1Locked()"
                >
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">01</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span
                      class="font-mono-rate text-mono-rate font-bold"
                      [class.text-success]="!isSlot1Locked()"
                      [class.text-ink-secondary]="isSlot1Locked()"
                    >
                      08:00 - 11:30 WIB
                    </span>
                    <span class="font-caption text-caption text-ink-secondary">(Pagi)</span>
                    @if (!isSlot1Locked()) {
                      <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                        SLOT TERBUKA PUBLIK
                      </span>
                    } @else {
                      <span class="bg-error-surface text-error px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                        DITUTUP SEMENTARA
                      </span>
                    }
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ !isSlot1Locked() ? 'Siap Menerima Pesanan Pagi' : 'Slot Pagi Ditutup dari Pemesanan Publik' }}
                  </span>
                  <span class="font-caption text-caption text-ink-secondary">
                    {{ !isSlot1Locked() ? 'Tampil aktif di profil publik Anda' : 'Klien tidak dapat memesan jam pagi pada tanggal ini' }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center flex-wrap">
                <button
                  type="button"
                  (click)="editSlotTime.emit('slot-01')"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-highlight rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Ubah Jam
                </button>
                <button
                  type="button"
                  (click)="toggleSlotLock.emit('slot-01')"
                  data-testid="toggle-slot-1-btn"
                  class="px-space-md py-space-xs rounded-lg text-caption font-button-label transition-colors shadow-xs cursor-pointer min-h-[44px]"
                  [class.bg-error]="!isSlot1Locked()"
                  [class.text-on-error]="!isSlot1Locked()"
                  [class.hover:bg-error-dark]="!isSlot1Locked()"
                  [class.bg-success]="isSlot1Locked()"
                  [class.text-on-primary]="isSlot1Locked()"
                  [class.hover:bg-emerald-700]="isSlot1Locked()"
                >
                  {{ !isSlot1Locked() ? 'Kunci Slot Pagi' : 'Buka Kunci Slot' }}
                </button>
              </div>
            </div>
          }

          <!-- BUFFER TRANSIT 1 -->
          <div class="p-space-md rounded-xl bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-hairline-subtle">
            <div class="flex items-center gap-space-md">
              <div class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0 text-ink-secondary">
                <span class="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-space-xs flex-wrap">
                  <span class="font-micro-uppercase text-micro-uppercase text-primary font-bold">
                    JEDA TRANSIT &amp; ISTIRAHAT SIANG
                  </span>
                  <span class="font-mono-rate text-mono-rate text-ink-secondary font-semibold">
                    11:30 - 13:00 WIB ({{ bufferMinutes() }} Menit)
                  </span>
                </div>
                <span class="font-caption text-caption text-ink-secondary">
                  Jeda perjalanan dan waktu makan siang. Sistem menahan pesanan baru agar tidak bentrok.
                </span>
              </div>
            </div>
          </div>

          <!-- SLOT 2 (SIANG) -->
          @if (slot2Booking(); as booking2) {
            <div class="bg-surface-highlight p-space-lg rounded-xl border border-hairline-subtle flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div class="flex items-start gap-space-md">
                <div class="w-12 h-12 bg-primary text-on-primary rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">02</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span class="font-mono-rate text-mono-rate text-primary font-bold">{{ booking2.timeRange }}</span>
                    <span class="font-caption text-caption text-ink-secondary">({{ booking2.durationText }})</span>
                    <span class="bg-warning-surface text-warning px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      {{ booking2.statusBadge }}
                    </span>
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ booking2.serviceName }} • {{ booking2.clientName }}
                  </span>
                  <div class="flex items-center gap-space-xs text-caption text-ink-secondary flex-wrap">
                    <span class="material-symbols-outlined text-[14px]">pin_drop</span>
                    <span>{{ booking2.clientLocation }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                <button
                  type="button"
                  (click)="viewOrderDetails.emit(booking2.orderId)"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Rincian Order
                </button>
              </div>
            </div>
          } @else {
            <!-- Slot 2 Available or Locked -->
            <div
              class="p-space-lg rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-colors"
              [class.bg-success-surface]="!isSlot2Locked()"
              [class.border-success/30]="!isSlot2Locked()"
              [class.bg-surface-container]="isSlot2Locked()"
              [class.border-hairline-subtle]="isSlot2Locked()"
            >
              <div class="flex items-start gap-space-md">
                <div
                  class="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                  [class.bg-success]="!isSlot2Locked()"
                  [class.text-on-primary]="!isSlot2Locked()"
                  [class.bg-neutral-600]="isSlot2Locked()"
                  [class.text-white]="isSlot2Locked()"
                >
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">02</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span
                      class="font-mono-rate text-mono-rate font-bold"
                      [class.text-success]="!isSlot2Locked()"
                      [class.text-ink-secondary]="isSlot2Locked()"
                    >
                      13:00 - 16:30 WIB
                    </span>
                    <span class="font-caption text-caption text-ink-secondary">(Siang)</span>
                    @if (!isSlot2Locked()) {
                      <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                        SLOT TERBUKA PUBLIK
                      </span>
                    } @else {
                      <span class="bg-error-surface text-error px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                        DITUTUP SEMENTARA
                      </span>
                    }
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ !isSlot2Locked() ? 'Siap Menerima Pesanan Siang' : 'Slot Siang Ditutup dari Pemesanan Publik' }}
                  </span>
                  <span class="font-caption text-caption text-ink-secondary">
                    {{ !isSlot2Locked() ? 'Tampil aktif di profil publik Anda' : 'Klien tidak dapat memesan jam siang pada tanggal ini' }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center flex-wrap">
                <button
                  type="button"
                  (click)="editSlotTime.emit('slot-02')"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-highlight rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Ubah Jam
                </button>
                <button
                  type="button"
                  (click)="toggleSlotLock.emit('slot-02')"
                  data-testid="toggle-slot-2-btn"
                  class="px-space-md py-space-xs rounded-lg text-caption font-button-label transition-colors shadow-xs cursor-pointer min-h-[44px]"
                  [class.bg-error]="!isSlot2Locked()"
                  [class.text-on-error]="!isSlot2Locked()"
                  [class.hover:bg-error-dark]="!isSlot2Locked()"
                  [class.bg-success]="isSlot2Locked()"
                  [class.text-on-primary]="isSlot2Locked()"
                  [class.hover:bg-emerald-700]="isSlot2Locked()"
                >
                  {{ !isSlot2Locked() ? 'Kunci Slot Siang' : 'Buka Kunci Slot' }}
                </button>
              </div>
            </div>
          }

          <!-- BUFFER TRANSIT 2 -->
          <div class="p-space-md rounded-xl bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-hairline-subtle">
            <div class="flex items-center gap-space-md">
              <div class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0 text-ink-secondary">
                <span class="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-space-xs flex-wrap">
                  <span class="font-micro-uppercase text-micro-uppercase text-primary font-bold">
                    JEDA TRANSIT SORE
                  </span>
                  <span class="font-mono-rate text-mono-rate text-ink-secondary font-semibold">
                    16:30 - 17:30 WIB (60 Menit)
                  </span>
                </div>
                <span class="font-caption text-caption text-ink-secondary">
                  Jeda istirahat dan persiapan sebelum slot sore/malam.
                </span>
              </div>
            </div>
          </div>

          <!-- SLOT 3 (SORE / MALAM) -->
          @if (slot3Booking(); as booking3) {
            <div class="bg-surface-highlight p-space-lg rounded-xl border border-hairline-subtle flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div class="flex items-start gap-space-md">
                <div class="w-12 h-12 bg-primary text-on-primary rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">03</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span class="font-mono-rate text-mono-rate text-primary font-bold">{{ booking3.timeRange }}</span>
                    <span class="font-caption text-caption text-ink-secondary">({{ booking3.durationText }})</span>
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ booking3.serviceName }} • {{ booking3.clientName }}
                  </span>
                  <div class="flex items-center gap-space-xs text-caption text-ink-secondary flex-wrap">
                    <span class="material-symbols-outlined text-[14px]">pin_drop</span>
                    <span>{{ booking3.clientLocation }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                <button
                  type="button"
                  (click)="viewOrderDetails.emit(booking3.orderId)"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Rincian Order
                </button>
              </div>
            </div>
          } @else {
            <!-- Slot 3 Available or Locked -->
            <div
              class="p-space-lg rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-colors"
              [class.bg-success-surface]="!isSlot3Locked()"
              [class.border-success/30]="!isSlot3Locked()"
              [class.bg-surface-container]="isSlot3Locked()"
              [class.border-hairline-subtle]="isSlot3Locked()"
            >
              <div class="flex items-start gap-space-md">
                <div
                  class="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                  [class.bg-success]="!isSlot3Locked()"
                  [class.text-on-primary]="!isSlot3Locked()"
                  [class.bg-neutral-600]="isSlot3Locked()"
                  [class.text-white]="isSlot3Locked()"
                >
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">03</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span
                      class="font-mono-rate text-mono-rate font-bold"
                      [class.text-success]="!isSlot3Locked()"
                      [class.text-ink-secondary]="isSlot3Locked()"
                    >
                      17:30 - 20:00 WIB
                    </span>
                    <span class="font-caption text-caption text-ink-secondary">(Sore/Malam)</span>
                    @if (!isSlot3Locked()) {
                      <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                        SLOT TERBUKA PUBLIK
                      </span>
                    } @else {
                      <span class="bg-error-surface text-error px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                        DITUTUP SEMENTARA
                      </span>
                    }
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ !isSlot3Locked() ? 'Siap Menerima Pesanan Sore' : 'Slot Sore Ditutup dari Pemesanan Publik' }}
                  </span>
                  <span class="font-caption text-caption text-ink-secondary">
                    {{ !isSlot3Locked() ? 'Tampil aktif di profil publik Anda' : 'Klien tidak dapat memesan jam sore pada tanggal ini' }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center flex-wrap">
                <button
                  type="button"
                  (click)="editSlotTime.emit('slot-03')"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-highlight rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Ubah Jam
                </button>
                <button
                  type="button"
                  (click)="toggleSlotLock.emit('slot-03')"
                  data-testid="toggle-slot-3-btn"
                  class="px-space-md py-space-xs rounded-lg text-caption font-button-label transition-colors shadow-xs cursor-pointer min-h-[44px]"
                  [class.bg-error]="!isSlot3Locked()"
                  [class.text-on-error]="!isSlot3Locked()"
                  [class.hover:bg-error-dark]="!isSlot3Locked()"
                  [class.bg-success]="isSlot3Locked()"
                  [class.text-on-primary]="isSlot3Locked()"
                  [class.hover:bg-emerald-700]="isSlot3Locked()"
                >
                  {{ !isSlot3Locked() ? 'Kunci Slot Ini' : 'Buka Kunci Slot' }}
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Add Overtime Slot Button -->
      <div class="flex justify-end pt-space-xs">
        <button
          type="button"
          (click)="addCustomSlot.emit()"
          class="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-highlight hover:bg-surface-container text-primary font-button-label text-button-label rounded-lg transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
        >
          <span class="material-symbols-outlined text-[18px]">more_time</span>
          <span>Tambah Slot Khusus / Lembur</span>
        </button>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleSlotTimelineCardComponent {
  readonly weekDayHeaders: readonly string[] = [
    'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min',
  ];

  // Inputs
  readonly isSlot1Locked = input<boolean>(false);
  readonly isSlot2Locked = input<boolean>(false);
  readonly isSlot3Locked = input<boolean>(false);
  readonly specialHolidays = input<string[]>([]);
  readonly schedules = input<WorkerScheduleItem[]>([]);
  readonly publicProfileUrl = input<string>('tuwaktu.com/profil');
  readonly bufferMinutes = input<number>(90);
  readonly isTodayEmergencyLocked = input<boolean>(false);
  readonly bookings = input<ScheduleSlotBooking[]>([]);

  // Outputs
  readonly toggleHoliday = output<string>();
  readonly viewOrderDetails = output<string>();
  readonly editSlotTime = output<string>();
  readonly toggleSlotLock = output<string>();
  readonly addCustomSlot = output<void>();

  // State Kalender Bulanan
  readonly calendarViewDate = signal<Date>(new Date());
  readonly selectedDate = signal<Date>(new Date());

  readonly currentMonthName = computed(() => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return months[this.calendarViewDate().getMonth()];
  });

  readonly currentYear = computed(() => this.calendarViewDate().getFullYear());

  readonly selectedIsoDate = computed(() => {
    const d = this.selectedDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  readonly selectedDateFormatted = computed(() => {
    const d = this.selectedDate();
    const days = [
      'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
    ];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly calendarDays = computed(() => {
    const viewDate = this.calendarViewDate();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week index for Monday start (Senin=0, ..., Minggu=6)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6;

    const days: CalendarMonthDay[] = [];
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Padding from previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDateNum = prevMonthLastDate - i;
      const d = new Date(year, month - 1, prevDateNum);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(prevDateNum).padStart(2, '0')}`;
      days.push({
        date: d,
        dayNumber: prevDateNum,
        isoDate: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        dayOfWeek: d.getDay(),
      });
    }

    // Days of current month
    for (let dNum = 1; dNum <= lastDayOfMonth.getDate(); dNum++) {
      const d = new Date(year, month, dNum);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        date: d,
        dayNumber: dNum,
        isoDate: iso,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        dayOfWeek: d.getDay(),
      });
    }

    // Padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let nextNum = 1; nextNum <= remaining; nextNum++) {
      const d = new Date(year, month + 1, nextNum);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(nextNum).padStart(2, '0')}`;
      days.push({
        date: d,
        dayNumber: nextNum,
        isoDate: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        dayOfWeek: d.getDay(),
      });
    }

    return days;
  });

  readonly isCurrentDateHoliday = computed(() => {
    const iso = this.selectedIsoDate();
    if (this.isSpecialHoliday(iso)) return true;
    const dayOfWeek = this.selectedDate().getDay();
    return this.isWeeklyDayOff(dayOfWeek);
  });

  // Slot Bookings Computed
  readonly slot1Booking = computed(
    () => this.bookings().find((b) => b.slotNumber === '01') || null,
  );
  readonly slot2Booking = computed(
    () => this.bookings().find((b) => b.slotNumber === '02') || null,
  );
  readonly slot3Booking = computed(
    () => this.bookings().find((b) => b.slotNumber === '03') || null,
  );

  readonly capacityMetricText = computed(() => {
    if (this.isCurrentDateHoliday()) {
      return 'Hari Libur (0 Slot)';
    }

    const lockedCount =
      (this.isSlot1Locked() ? 1 : 0) +
      (this.isSlot2Locked() ? 1 : 0) +
      (this.isSlot3Locked() ? 1 : 0);

    const booked = this.bookings().length;
    if (lockedCount > 0 && booked === 0) {
      return `${lockedCount} dari 3 Slot Terkunci`;
    }
    return `${booked} dari 3 Slot Terisi`;
  });

  readonly capacitySubText = computed(() => {
    if (this.isCurrentDateHoliday()) {
      return '0% Kapasitas • Tidak Menerima Pemesanan Publik';
    }

    const lockedCount =
      (this.isSlot1Locked() ? 1 : 0) +
      (this.isSlot2Locked() ? 1 : 0) +
      (this.isSlot3Locked() ? 1 : 0);

    const booked = this.bookings().length;
    const available = Math.max(0, 3 - booked - lockedCount);
    const percent = Math.round(((booked + lockedCount) / 3) * 100);

    return `${percent}% Kapasitas Terpakai • ${available} Slot Tersedia`;
  });

  isDateSelected(isoDate: string): boolean {
    return this.selectedIsoDate() === isoDate;
  }

  isSpecialHoliday(isoDate: string): boolean {
    return this.specialHolidays().includes(isoDate);
  }

  isWeeklyDayOff(dayOfWeek: number): boolean {
    const schedule = this.schedules().find((s) => s.day_of_week === dayOfWeek);
    return schedule ? !schedule.is_active : dayOfWeek === 0; // Default Minggu libur
  }

  selectCalendarDate(date: Date): void {
    this.selectedDate.set(new Date(date));
  }

  previousMonth(): void {
    const current = this.calendarViewDate();
    this.calendarViewDate.set(
      new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  nextMonth(): void {
    const current = this.calendarViewDate();
    this.calendarViewDate.set(
      new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  goToToday(): void {
    const today = new Date();
    this.calendarViewDate.set(new Date(today));
    this.selectedDate.set(new Date(today));
  }

  handleToggleHoliday(): void {
    this.toggleHoliday.emit(this.selectedIsoDate());
  }
}
