import { ChangeDetectionStrategy, Component, output } from '@angular/core';

export const WHATSAPP_TEMPLATE_VARIABLES: readonly string[] = [
  '{{NAMA_KLIEN}}',
  '{{LAYANAN}}',
  '{{TANGGAL_JAM}}',
  '{{ALAMAT}}',
  '{{JARAK_KM}}',
  '{{ONGKOS_JALAN}}',
  '{{TOTAL_BIAYA}}',
  '{{CATATAN}}',
] as const;

@Component({
  selector: 'app-whatsapp-variable-chips',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-2" id="variable-chips">
      @for (variableToken of templateVariables; track variableToken) {
        <button
          type="button"
          (click)="selectToken(variableToken)"
          [attr.data-token]="variableToken"
          class="chip-token px-3 py-2 bg-surface-highlight hover:bg-surface-variant text-primary font-mono-rate text-caption rounded transition-colors flex items-center gap-1 min-h-[44px] cursor-pointer"
          [attr.aria-label]="'Sisipkan variabel ' + variableToken"
        >
          <span class="text-voltage-orange font-bold text-sm">+</span>
          <span>{{ variableToken }}</span>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppVariableChipsComponent {
  readonly templateVariables = WHATSAPP_TEMPLATE_VARIABLES;
  readonly tokenSelected = output<string>();

  selectToken(token: string): void {
    this.tokenSelected.emit(token);
  }
}
