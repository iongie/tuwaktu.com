import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-schedule-slot-timeline-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-space-lg">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div class="flex flex-col gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
            <h2 class="font-heading-2 text-heading-2 text-primary font-bold">
              Visualisasi Slot &amp; Timeline Eksekusi
            </h2>
          </div>
          <span class="font-caption text-caption text-ink-secondary">
            Daftar blok kerja terperinci dengan penguncian transit otomatis di antara janji temu.
          </span>
        </div>

        <!-- Date Picker Segment Filter -->
        <div class="flex items-center gap-space-xs bg-surface-highlight p-1 rounded-xl border border-hairline-subtle flex-wrap">
          <button
            type="button"
            (click)="segmentChange.emit('Hari Ini')"
            class="px-space-md py-space-xs font-button-label text-button-label rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center"
            [class.bg-primary]="isToday()"
            [class.text-on-primary]="isToday()"
            [class.shadow-xs]="isToday()"
            [class.text-ink-secondary]="!isToday()"
            [class.hover:text-primary]="!isToday()"
          >
            Hari Ini
          </button>
          <button
            type="button"
            (click)="segmentChange.emit('Besok')"
            class="px-space-md py-space-xs font-button-label text-button-label rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center"
            [class.bg-primary]="isTomorrow()"
            [class.text-on-primary]="isTomorrow()"
            [class.shadow-xs]="isTomorrow()"
            [class.text-ink-secondary]="!isTomorrow()"
            [class.hover:text-primary]="!isTomorrow()"
          >
            Besok
          </button>
          <button
            type="button"
            (click)="segmentChange.emit('Sabtu')"
            class="px-space-md py-space-xs font-button-label text-button-label rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center"
            [class.bg-primary]="isSaturday()"
            [class.text-on-primary]="isSaturday()"
            [class.shadow-xs]="isSaturday()"
            [class.text-ink-secondary]="!isSaturday()"
            [class.hover:text-primary]="!isSaturday()"
          >
            Sabtu
          </button>
          <button
            type="button"
            (click)="segmentChange.emit('Minggu (Libur)')"
            class="px-space-md py-space-xs font-button-label text-button-label rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center"
            [class.bg-error]="isSunday()"
            [class.text-on-error]="isSunday()"
            [class.shadow-xs]="isSunday()"
            [class.text-error]="!isSunday()"
            [class.hover:bg-error-surface]="!isSunday()"
          >
            Minggu (Libur)
          </button>
        </div>
      </div>

      <!-- Capacity Utilization Metric Bar -->
      <div class="bg-surface-highlight p-space-md rounded-xl border border-hairline-subtle flex flex-col gap-space-xs">
        <div class="flex items-center justify-between text-body-strong flex-wrap gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="font-body-strong text-body-strong text-primary">{{ capacityHeadline() }}</span>
            <span
              class="font-mono-rate text-mono-rate font-bold"
              [class.text-voltage-orange]="!isSunday() && !(isToday() && isTodayEmergencyLocked())"
              [class.text-error]="isSunday() || (isToday() && isTodayEmergencyLocked())"
            >
              {{ capacityMetricText() }}
            </span>
          </div>
          <span class="font-caption text-caption text-ink-secondary">{{ capacitySubText() }}</span>
        </div>
        <div class="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden flex" role="progressbar" aria-valuenow="67" aria-valuemin="0" aria-valuemax="100">
          @if (isSunday()) {
            <div class="bg-surface-variant h-full w-full" title="Hari Istirahat"></div>
          } @else if (isToday() && isTodayEmergencyLocked()) {
            <div class="bg-error h-full w-full" title="Terkunci Darurat"></div>
          } @else if (isSaturday()) {
            <div [class.bg-primary]="slot1Booking()" [class.bg-success-surface]="!slot1Booking()" class="h-full w-[50%]" [title]="slot1Booking() ? 'Slot 01: Terisi' : 'Slot 01: Tersedia'"></div>
            <div [class.bg-voltage-orange]="slot2Booking()" [class.bg-success-surface]="!slot2Booking()" class="h-full w-[50%] border-l border-white/40" [title]="slot2Booking() ? 'Slot 02: Terisi' : 'Slot 02: Tersedia'"></div>
          } @else {
            <div [class.bg-primary]="slot1Booking()" [class.bg-success-surface]="!slot1Booking()" class="h-full w-[33.3%]" [title]="slot1Booking() ? 'Slot 01: Terisi' : 'Slot 01: Tersedia'"></div>
            <div [class.bg-voltage-orange]="slot2Booking()" [class.bg-success-surface]="!slot2Booking()" class="h-full w-[33.3%]" [title]="slot2Booking() ? 'Slot 02: Terisi' : 'Slot 02: Tersedia'"></div>
            @if (!isSlot3Locked()) {
              <div [class.bg-secondary]="slot3Booking()" [class.bg-success-surface]="!slot3Booking()" class="h-full w-[33.4%] border-l border-white/40" [title]="slot3Booking() ? 'Slot 03: Terisi' : 'Slot 03: Tersedia'"></div>
            } @else {
              <div class="bg-neutral-600 h-full w-[33.4%] border-l border-white/40" title="Slot 03: Terkunci"></div>
            }
          }
        </div>
      </div>

      <!-- Interactive Time Block List -->
      <div class="flex flex-col gap-space-md">
        @if (isSunday()) {
          <!-- Empty State Hari Istirahat Mandiri untuk Minggu -->
          <div class="p-space-xl rounded-xl bg-surface-highlight border border-hairline-subtle flex flex-col items-center justify-center text-center gap-space-sm py-12">
            <div class="w-12 h-12 rounded-xl bg-error-surface text-error flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-[28px]">do_not_disturb_on</span>
            </div>
            <span class="font-heading-3 text-heading-3 text-primary font-bold">
              Hari Istirahat Mandiri Terjadwal
            </span>
            <p class="font-caption text-caption text-ink-secondary max-w-md leading-relaxed">
              Sesuai matriks jam kerja mingguan, hari Minggu dinonaktifkan dari sistem pemesanan publik untuk pemulihan fisik dan stamina teknisi.
            </p>
            <button
              type="button"
              (click)="addCustomSlot.emit()"
              class="mt-2 flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest hover:bg-surface-container text-primary font-button-label text-button-label rounded-lg transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[18px]">more_time</span>
              <span>Buka Slot Khusus Hari Ini</span>
            </button>
          </div>
        } @else {
          @if (isToday() && isTodayEmergencyLocked()) {
            <!-- Emergency Alert Banner on Today -->
            <div class="p-space-md rounded-xl bg-error-surface border border-error/30 flex items-center gap-space-md text-error">
              <span class="material-symbols-outlined text-[24px] shrink-0">emergency</span>
              <div class="flex flex-col">
                <span class="font-body-strong text-body-strong font-bold">
                  Status Darurat Aktif: Semua Slot Hari Ini Terkunci
                </span>
                <span class="font-caption text-caption text-error/90">
                  Semua slot untuk hari ini telah ditutup sementara dari pemesanan publik sesuai protokol penguncian mandiri.
                </span>
              </div>
            </div>
          }

          <!-- SLOT 1 -->
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
                    <span class="bg-success-surface text-success px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      {{ booking1.statusBadge }}
                    </span>
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    {{ booking1.serviceName }} • {{ booking1.clientName }}
                  </span>
                  <div class="flex items-center gap-space-xs text-caption text-ink-secondary flex-wrap">
                    <span class="material-symbols-outlined text-[14px]">pin_drop</span>
                    <span>{{ booking1.clientLocation }}</span>
                    <span class="text-ink-secondary">•</span>
                    <span class="text-whatsapp-green font-semibold">{{ booking1.statusText }}</span>
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
            <div class="bg-surface-highlight p-space-lg rounded-xl border border-hairline-subtle flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div class="flex items-start gap-space-md">
                <div class="w-12 h-12 bg-success text-on-primary rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">01</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span class="font-mono-rate text-mono-rate text-primary font-bold">08:30 - 11:30 WIB</span>
                    <span class="font-caption text-caption text-ink-secondary">(Durasi 3 Jam)</span>
                    <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      SLOT TERBUKA PUBLIK
                    </span>
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    Siap Menerima Pesanan Klien Pagi
                  </span>
                  <span class="font-caption text-caption text-ink-secondary">
                    Tampil aktif di tautan publik {{ publicProfileUrl() }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                <button
                  type="button"
                  (click)="editSlotTime.emit('slot-01')"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-highlight rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Ubah Jam
                </button>
              </div>
            </div>
          }

          <!-- MANDATORY BUFFER BLOCK 1 -->
          <div class="p-space-md rounded-xl bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-hairline-subtle">
            <div class="flex items-center gap-space-md">
              <div class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0 text-ink-secondary">
                <span class="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-space-xs flex-wrap">
                  <span class="font-micro-uppercase text-micro-uppercase text-primary font-bold">
                    BUFFER TRANSIT TERKUNCI OTOMATIS
                  </span>
                  <span class="font-mono-rate text-mono-rate text-ink-secondary font-semibold">
                    11:30 - 13:00 WIB ({{ bufferMinutes() }} Menit)
                  </span>
                </div>
                <span class="font-caption text-caption text-ink-secondary">
                  Jeda Transit Perjalanan &amp; Persiapan Peralatan Operasional (Sistem Menolak Booking Baru)
                </span>
              </div>
            </div>
            <div class="flex items-center gap-space-xs self-end sm:self-center">
              <span class="bg-surface-variant text-ink-secondary text-micro-uppercase font-micro-uppercase px-space-xs py-0.5 rounded font-bold">
                ANTI-BENTROK
              </span>
            </div>
          </div>

          <!-- SLOT 2 -->
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
                    @if (booking2.departureEstimate) {
                      <span class="text-ink-secondary">•</span>
                      <span class="text-primary font-semibold">{{ booking2.departureEstimate }}</span>
                    }
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
            <div class="bg-surface-highlight p-space-lg rounded-xl border border-hairline-subtle flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div class="flex items-start gap-space-md">
                <div class="w-12 h-12 bg-success text-on-primary rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span class="font-micro-uppercase text-micro-uppercase tracking-wider">SLOT</span>
                  <span class="font-body-strong text-body-strong font-bold">02</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-space-sm flex-wrap">
                    <span class="font-mono-rate text-mono-rate text-primary font-bold">13:00 - 16:00 WIB</span>
                    <span class="font-caption text-caption text-ink-secondary">(Durasi 3 Jam)</span>
                    <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      SLOT TERBUKA PUBLIK
                    </span>
                  </div>
                  <span class="font-lead-body text-lead-body text-primary font-bold">
                    Siap Menerima Pesanan Klien Siang
                  </span>
                  <span class="font-caption text-caption text-ink-secondary">
                    Tampil aktif di tautan publik {{ publicProfileUrl() }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                <button
                  type="button"
                  (click)="editSlotTime.emit('slot-02')"
                  class="px-space-md py-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-highlight rounded-lg text-caption font-button-label transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
                >
                  Ubah Jam
                </button>
              </div>
            </div>
          }

          <!-- MANDATORY BUFFER BLOCK 2 -->
          <div class="p-space-md rounded-xl bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-hairline-subtle">
            <div class="flex items-center gap-space-md">
              <div class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center shrink-0 text-ink-secondary">
                <span class="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-space-xs flex-wrap">
                  <span class="font-micro-uppercase text-micro-uppercase text-primary font-bold">
                    BUFFER TRANSIT TERKUNCI OTOMATIS
                  </span>
                  <span class="font-mono-rate text-mono-rate text-ink-secondary font-semibold">
                    16:00 - 17:30 WIB ({{ bufferMinutes() }} Menit)
                  </span>
                </div>
                <span class="font-caption text-caption text-ink-secondary">
                  Jeda Transit Perjalanan + Buffer Jam Sibuk Sore &amp; Rehidrasi Pekerja
                </span>
              </div>
            </div>
            <div class="flex items-center gap-space-xs self-end sm:self-center">
              <span class="bg-surface-variant text-ink-secondary text-micro-uppercase font-micro-uppercase px-space-xs py-0.5 rounded font-bold">
                ANTI-BENTROK
              </span>
            </div>
          </div>

          <!-- SLOT 3: Available for Booking -->
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
                  <span class="font-caption text-caption text-ink-secondary">(Durasi 2.5 Jam)</span>
                  @if (!isSlot3Locked()) {
                    <span class="bg-success text-on-primary px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      SLOT TERBUKA PUBLIK
                    </span>
                  } @else {
                    <span class="bg-error-surface text-error px-space-xs py-0.5 rounded font-micro-uppercase text-micro-uppercase font-bold">
                      TERKUNCI SEMENTARA
                    </span>
                  }
                </div>
                <span class="font-lead-body text-lead-body text-primary font-bold">
                  {{ !isSlot3Locked() ? 'Siap Menerima Pesanan Klien Baru' : 'Slot Ditutup Sementara dari Publik' }}
                </span>
                <span class="font-caption text-caption text-ink-secondary">
                  {{ !isSlot3Locked() ? 'Tampil aktif di tautan publik ' + publicProfileUrl() : 'Tidak akan muncul pada formulir pemesanan publik' }}
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
      </div>

      <!-- Add Overtime Slot Button -->
      <div class="flex justify-end pt-space-xs">
        <button
          type="button"
          (click)="addCustomSlot.emit()"
          class="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-highlight hover:bg-surface-container text-primary font-button-label text-button-label rounded-lg transition-colors border border-hairline-subtle shadow-xs cursor-pointer min-h-[44px]"
        >
          <span class="material-symbols-outlined text-[18px]">more_time</span>
          <span>+ Tambah Slot Khusus / Lembur</span>
        </button>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleSlotTimelineCardComponent {
  readonly selectedSegment = input<string>('Besok');
  readonly isSlot3Locked = input<boolean>(false);
  readonly publicProfileUrl = input<string>('tuwaktu.com/profil');
  readonly bufferMinutes = input<number>(90);
  readonly isTodayEmergencyLocked = input<boolean>(false);
  readonly bookings = input<ScheduleSlotBooking[]>([]);

  readonly segmentChange = output<string>();
  readonly viewOrderDetails = output<string>();
  readonly editSlotTime = output<string>();
  readonly toggleSlotLock = output<string>();
  readonly addCustomSlot = output<void>();

  readonly slot1Booking = computed(() => this.bookings().find((b) => b.slotNumber === '01') || null);
  readonly slot2Booking = computed(() => this.bookings().find((b) => b.slotNumber === '02') || null);
  readonly slot3Booking = computed(() => this.bookings().find((b) => b.slotNumber === '03') || null);

  readonly isSunday = computed(() => this.selectedSegment().includes('Minggu'));
  readonly isToday = computed(() => this.selectedSegment().includes('Hari Ini'));
  readonly isSaturday = computed(() => this.selectedSegment().includes('Sabtu'));
  readonly isTomorrow = computed(() => this.selectedSegment().includes('Besok'));

  readonly capacityHeadline = computed(() => {
    if (this.isSunday()) {
      return 'Kapasitas Slot Minggu:';
    }
    if (this.isToday()) {
      return 'Kapasitas Slot Hari Ini:';
    }
    if (this.isSaturday()) {
      return 'Kapasitas Slot Sabtu:';
    }
    return 'Kapasitas Slot Besok:';
  });

  readonly capacityMetricText = computed(() => {
    if (this.isSunday()) {
      return 'Hari Libur Mandiri (0 Slot)';
    }
    if (this.isToday() && this.isTodayEmergencyLocked()) {
      return 'Terkunci Sementara (Darurat)';
    }

    const totalSlots = this.isSaturday() ? 2 : 3;
    const booked = this.bookings().length;
    if (booked === 0) {
      if (this.isSlot3Locked() && !this.isSaturday()) {
        return '1 dari 3 Slot Terkunci';
      }
      return `0 dari ${totalSlots} Slot Terisi`;
    }
    return `${booked} dari ${totalSlots} Slot Terisi`;
  });

  readonly capacitySubText = computed(() => {
    if (this.isSunday()) {
      return '0% Kapasitas • Tidak Menerima Pemesanan Publik';
    }
    if (this.isToday() && this.isTodayEmergencyLocked()) {
      return '0 Slot Tersedia • Emergency Lock Aktif';
    }

    const totalSlots = this.isSaturday() ? 2 : 3;
    const booked = this.bookings().length;
    const lockedCount = (!this.isSaturday() && this.isSlot3Locked()) ? 1 : 0;
    const available = Math.max(0, totalSlots - booked - lockedCount);
    const percent = Math.round(((booked + lockedCount) / totalSlots) * 100);

    return `${percent}% Kapasitas Terpakai • ${available} Slot Tersedia`;
  });
}
