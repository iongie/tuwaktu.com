import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummarySlotTrackBarComponent } from '../../molecules/summary-slot-track-bar/summary-slot-track-bar.component';
import {
  SummarySlotTimelineItemComponent,
  SummaryTimelineSlotItem,
} from '../../molecules/summary-slot-timeline-item/summary-slot-timeline-item.component';

@Component({
  selector: 'app-summary-schedule-hub',
  standalone: true,
  imports: [
    CommonModule,
    SummarySlotTrackBarComponent,
    SummarySlotTimelineItemComponent,
  ],
  template: `
    <section
      class="bg-surface-container-lowest border border-hairline-subtle rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6"
    >
      <!-- Hub Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline-subtle">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-orange-50 text-voltage-orange flex items-center justify-center shrink-0 border border-orange-100"
          >
            <span class="material-symbols-outlined text-[22px]">calendar_today</span>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-on-surface">
              Jadwal &amp; Status Slot Hari Ini
            </h2>
            <p class="text-xs text-on-surface-variant mt-0.5">
              {{ todayFormattedDate() }}
            </p>
          </div>
        </div>

        <span
          class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-center"
        >
          {{ activeSlotsBadge() }}
        </span>
      </div>

      <!-- Molecule: Visual Multi-Segment Progress Track Bar -->
      <app-summary-slot-track-bar />

      <!-- Timeline Schedule Items -->
      <div class="space-y-3">
        @for (item of timelineItems(); track item.id) {
          <app-summary-slot-timeline-item
            [item]="item"
            (lockSlot)="handleLockToggle($event)"
          />
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryScheduleHubComponent {
  readonly todayFormattedDate = computed(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    return `${formatted} • Otomatis Terkunci Buffer`;
  });

  readonly timelineItems = signal<SummaryTimelineSlotItem[]>([
    {
      id: 'slot-1',
      type: 'slot',
      timeRange: '08:30 - 11:30',
      title: 'Slot Pagi Terbuka',
      description: 'Jendela kerja: 08:30 - 11:30 (Maks 3.0 Jam Durasi)',
      statusBadge: 'SIAP DIPESAN',
      statusVariant: 'available',
      actionType: 'lock',
      isLocked: false,
    },
    {
      id: 'buffer-1',
      type: 'buffer',
      timeRange: '11:30 - 13:00',
      title: 'TRANSIT BUFFER • 90 MENIT',
      description: 'Otomatis Terkunci & Sterilisasi Alat',
      actionType: 'none',
    },
    {
      id: 'slot-2',
      type: 'slot',
      timeRange: '13:00 - 15:30',
      title: 'Slot Siang Terbuka',
      description: 'Jendela kerja: 13:00 - 15:30 (Maks 2.5 Jam Durasi)',
      statusBadge: 'SIAP DIPESAN',
      statusVariant: 'available',
      actionType: 'lock',
      isLocked: false,
    },
    {
      id: 'buffer-2',
      type: 'buffer',
      timeRange: '15:30 - 17:00',
      title: 'TRANSIT BUFFER • 90 MENIT',
      description: 'Perjalanan Balik / Istirahat Mandiri',
      actionType: 'none',
    },
    {
      id: 'slot-3',
      type: 'slot',
      timeRange: '17:00 - 20:00',
      title: 'Slot Sore Terbuka',
      description: 'Jendela kerja: 17:00 - 20:00 (Maks 3.0 Jam Durasi)',
      statusBadge: 'SIAP DIPESAN',
      statusVariant: 'available',
      actionType: 'lock',
      isLocked: false,
    },
  ]);

  readonly activeSlotsBadge = computed(() => {
    const slots = this.timelineItems().filter((item) => item.type === 'slot');
    const filledCount = slots.filter(
      (item) => item.statusVariant !== 'available' && !item.isLocked,
    ).length;
    return `${filledCount}/${slots.length} Slot Terisi`;
  });

  handleLockToggle(item: SummaryTimelineSlotItem): void {
    this.timelineItems.update((items) =>
      items.map((slot) => {
        if (slot.id === item.id) {
          const isNowLocked = !slot.isLocked;
          return {
            ...slot,
            isLocked: isNowLocked,
            statusBadge: isNowLocked ? 'TERKUNCI MANDIRI' : 'SIAP DIPESAN',
          };
        }
        return slot;
      }),
    );
  }
}
