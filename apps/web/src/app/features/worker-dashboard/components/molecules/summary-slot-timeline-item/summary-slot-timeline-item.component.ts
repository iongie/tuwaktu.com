import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryTimelineSlotItem {
  id: string;
  type: 'slot' | 'buffer';
  timeRange: string;
  title: string;
  service?: string;
  location?: string;
  payment?: string;
  statusBadge?: string;
  statusVariant?: 'completed' | 'active' | 'available';
  description?: string;
  chatUrl?: string;
  mapsUrl?: string;
  actionType: 'chat' | 'maps' | 'lock' | 'none';
  isLocked?: boolean;
}

@Component({
  selector: 'app-summary-slot-timeline-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (item.type === 'buffer') {
      <!-- Transit Buffer Item -->
      <div
        class="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-amber-950 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]">lock_clock</span>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-mono font-bold tracking-wider text-amber-900 block truncate">
              {{ item.title }}
            </span>
            <span class="text-[11px] text-amber-800/80 block truncate">
              {{ item.description }}
            </span>
          </div>
        </div>
        <div
          class="font-mono text-xs font-bold text-amber-800 bg-white/80 px-2.5 py-1 rounded-md border border-amber-200 shrink-0"
        >
          {{ item.timeRange }}
        </div>
      </div>
    } @else {
      <!-- Regular Slot Card -->
      <div
        class="rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
        [class.bg-surface-container-lowest]="item.statusVariant !== 'available'"
        [class.border]="item.statusVariant !== 'active'"
        [class.border-hairline-subtle]="item.statusVariant !== 'active'"
        [class.shadow-2xs]="item.statusVariant !== 'available'"
        [class.border-2]="item.statusVariant === 'active'"
        [class.border-(--voltage-orange)/40]="item.statusVariant === 'active'"
        [class.bg-surface-container-low/50]="item.statusVariant === 'available'"
        [class.border-dashed]="item.statusVariant === 'available'"
        [class.border-hairline-light]="item.statusVariant === 'available'"
      >
        <!-- Left: Slot Info -->
        <div class="space-y-1.5 min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-xs font-bold text-on-surface">
              {{ item.timeRange }}
            </span>

            @if (item.statusVariant === 'completed') {
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {{ item.statusBadge || 'SELESAI' }}
              </span>
            } @else if (item.statusVariant === 'active') {
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200"
              >
                <span class="relative flex h-2 w-2">
                  <span
                    class="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"
                  ></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {{ item.statusBadge || 'SIAP BERANGKAT' }}
              </span>
            } @else if (item.statusVariant === 'available') {
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                [class.bg-blue-50]="!item.isLocked"
                [class.text-blue-700]="!item.isLocked"
                [class.border-blue-200]="!item.isLocked"
                [class.bg-gray-100]="item.isLocked"
                [class.text-gray-700]="item.isLocked"
                [class.border-gray-200]="item.isLocked"
              >
                {{ item.isLocked ? 'TERKUNCI MANDIRI' : (item.statusBadge || 'SIAP DIPESAN') }}
              </span>
            }
          </div>

          <div class="text-sm font-bold text-on-surface">
            {{ item.title }}
          </div>

          @if (item.service) {
            <div class="text-xs text-on-surface-variant font-medium">
              {{ item.service }}
            </div>
          }

          @if (item.location) {
            <div class="text-xs text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-on-surface-variant">location_on</span>
              <span>{{ item.location }}</span>
            </div>
          }

          @if (item.payment) {
            <div class="text-xs font-mono font-bold text-on-surface pt-0.5">
              {{ item.payment }}
            </div>
          }

          @if (item.description && item.statusVariant === 'available') {
            <div class="text-xs text-on-surface-variant font-normal">
              {{ item.description }}
            </div>
          }
        </div>

        <!-- Right: Action Button / Link -->
        <div class="shrink-0 flex items-center gap-2 pt-2 md:pt-0">
          @if (item.actionType === 'chat' && item.chatUrl) {
            <a
              [href]="item.chatUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[44px] px-3.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
              aria-label="Chat Klien di WhatsApp"
            >
              <span class="material-symbols-outlined text-[16px]">chat</span>
              <span>Chat Klien</span>
            </a>
          } @else if (item.actionType === 'maps' && item.mapsUrl) {
            <a
              [href]="item.mapsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[44px] px-3.5 rounded-lg bg-on-surface hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              aria-label="Buka Rute Google Maps"
            >
              <span class="material-symbols-outlined text-[16px]">navigation</span>
              <span>Buka Rute Maps</span>
            </a>
          } @else if (item.actionType === 'lock') {
            <button
              type="button"
              (click)="onLockToggle()"
              class="min-h-[44px] px-3.5 rounded-lg border border-hairline-subtle bg-white hover:bg-surface-highlight text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              [attr.aria-label]="item.isLocked ? 'Buka Kunci Slot Ini' : 'Kunci Slot Ini'"
            >
              <span class="material-symbols-outlined text-[16px]">
                {{ item.isLocked ? 'lock_open' : 'lock' }}
              </span>
              <span>{{ item.isLocked ? 'Buka Slot' : 'Kunci Slot Ini' }}</span>
            </button>
          }
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarySlotTimelineItemComponent {
  @Input({ required: true }) item!: SummaryTimelineSlotItem;
  @Output() readonly lockSlot = new EventEmitter<SummaryTimelineSlotItem>();

  onLockToggle(): void {
    this.lockSlot.emit(this.item);
  }
}
