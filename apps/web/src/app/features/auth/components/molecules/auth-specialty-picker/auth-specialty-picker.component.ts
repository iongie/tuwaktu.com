import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialtyOption } from '../../../models/auth.models';

@Component({
  selector: 'app-auth-specialty-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-1">
      <span class="font-body-strong text-body-strong text-ink-on-light" id="specialty-label">
        Spesialisasi & Bidang Keahlian Pokok
      </span>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1"
        role="group"
        aria-labelledby="specialty-label"
      >
        @for (option of options(); track option.id) {
          <button
            type="button"
            [attr.aria-pressed]="selectedId() === option.id"
            [class.sm:col-span-2]="option.colSpan"
            (click)="selectSpecialty.emit(option)"
            class="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-all group min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-(--voltage-orange) focus-visible:outline-offset-2"
            [class.bg-hero-canvas]="selectedId() === option.id"
            [class.text-ink-on-dark]="selectedId() === option.id"
            [class.bg-surface-container]="selectedId() !== option.id"
            [class.hover:bg-surface-container-high]="selectedId() !== option.id"
          >
            <span
              class="font-button-label text-button-label font-medium"
              [class.text-ink-on-dark]="selectedId() === option.id"
              [class.text-on-surface-variant]="selectedId() !== option.id"
              [class.group-hover:text-primary]="selectedId() !== option.id"
            >
              {{ option.label }}
            </span>
            @if (selectedId() === option.id) {
              <span class="material-symbols-outlined text-[18px] text-voltage-orange">
                check_circle
              </span>
            } @else {
              <span class="material-symbols-outlined text-[18px] text-ink-disabled opacity-0 group-hover:opacity-40 transition-opacity">
                radio_button_unchecked
              </span>
            }
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSpecialtyPickerComponent {
  readonly options = input.required<readonly SpecialtyOption[]>();
  readonly selectedId = input.required<string>();
  readonly selectSpecialty = output<SpecialtyOption>();
}
