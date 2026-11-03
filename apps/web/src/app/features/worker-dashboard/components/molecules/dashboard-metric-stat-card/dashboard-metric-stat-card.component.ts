import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-metric-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-colors hover:bg-white/[0.08] shadow-xs"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-medium text-white/60 uppercase tracking-wider block">
          {{ label() }}
        </span>
        <div
          class="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/80 shrink-0"
        >
          <span class="material-symbols-outlined text-[18px]">{{ icon() }}</span>
        </div>
      </div>

      <div class="my-2">
        <div class="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">
          {{ value() }}
        </div>
        @if (subtext()) {
          <div class="text-xs text-white/70 font-medium mt-0.5">
            {{ subtext() }}
          </div>
        }
      </div>

      @if (trendText()) {
        <div
          class="flex items-center gap-1 text-[11px] font-medium pt-1 border-t border-white/5"
          [class.text-emerald-400]="trendType() === 'positive'"
          [class.text-amber-400]="trendType() === 'warning'"
          [class.text-white/60]="trendType() === 'neutral'"
        >
          @if (trendIcon()) {
            <span class="material-symbols-outlined text-sm">{{ trendIcon() }}</span>
          }
          <span>{{ trendText() }}</span>
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
}

