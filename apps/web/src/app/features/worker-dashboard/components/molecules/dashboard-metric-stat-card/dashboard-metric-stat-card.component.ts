import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-metric-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-surface-container-lowest border border-hairline-subtle rounded-xl p-5 flex flex-col justify-between transition-all hover:border-hairline-light hover:shadow-xs shadow-2xs"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
          {{ label() }}
        </span>
        @if (badgeText()) {
          <span
            class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border"
            [class.bg-emerald-50]="badgeType() === 'positive'"
            [class.text-emerald-700]="badgeType() === 'positive'"
            [class.border-emerald-200]="badgeType() === 'positive'"
            [class.bg-amber-50]="badgeType() === 'warning'"
            [class.text-amber-700]="badgeType() === 'warning'"
            [class.border-amber-200]="badgeType() === 'warning'"
            [class.bg-surface-container-low]="badgeType() === 'neutral'"
            [class.text-on-surface-variant]="badgeType() === 'neutral'"
            [class.border-hairline-subtle]="badgeType() === 'neutral'"
          >
            {{ badgeText() }}
          </span>
        } @else {
          <div
            class="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]">{{ icon() }}</span>
          </div>
        }
      </div>

      <div class="my-3">
        <div class="text-2xl sm:text-3xl font-bold font-mono text-primary tracking-tight">
          {{ value() }}
        </div>
        @if (subtext()) {
          <div class="text-xs text-on-surface-variant font-medium mt-1">
            {{ subtext() }}
          </div>
        }
        @if (activeStars().length > 0) {
          <div class="flex items-center gap-0.5 mt-1.5 text-voltage-orange">
            @for (star of activeStars(); track star) {
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
            }
          </div>
        }
      </div>

      @if (trendText()) {
        <div
          class="flex items-center gap-1.5 text-xs font-medium pt-2.5 border-t border-hairline-subtle"
          [class.text-emerald-700]="trendType() === 'positive'"
          [class.text-amber-700]="trendType() === 'warning'"
          [class.text-on-surface-variant]="trendType() === 'neutral'"
        >
          @if (trendIcon()) {
            <span class="material-symbols-outlined text-[15px] shrink-0">{{ trendIcon() }}</span>
          }
          <span class="truncate">{{ trendText() }}</span>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMetricStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input.required<string>();
  readonly subtext = input<string>('');
  readonly trendIcon = input<string>('');
  readonly trendText = input<string>('');
  readonly trendType = input<'positive' | 'warning' | 'neutral'>('positive');
  readonly badgeText = input<string>('');
  readonly badgeType = input<'positive' | 'warning' | 'neutral'>('positive');
  readonly starsCount = input<number>(0);

  readonly activeStars = computed(() =>
    Array.from(
      { length: Math.min(5, Math.max(0, this.starsCount())) },
      (_, index) => index + 1
    )
  );
}
