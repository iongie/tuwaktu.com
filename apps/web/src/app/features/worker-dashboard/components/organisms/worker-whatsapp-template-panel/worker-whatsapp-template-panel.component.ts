import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WhatsAppVariableChipsComponent } from '../../molecules/whatsapp-variable-chips/whatsapp-variable-chips.component';

@Component({
  selector: 'app-worker-whatsapp-template-panel',
  standalone: true,
  imports: [CommonModule, WhatsAppVariableChipsComponent],
  template: `
    <section
      class="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-5 border border-hairline-subtle"
    >
      <!-- Panel Header & Protocol Badge -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0"
          >
            <span class="material-symbols-outlined text-[20px]">terminal</span>
          </div>
          <div>
            <h2 class="font-heading-3 text-heading-3 text-ink-on-light">
              Format Template Pesan
            </h2>
            <span class="font-caption text-caption text-ink-secondary">
              Format teks yang otomatis terisi saat klien memesan layanan Anda
            </span>
          </div>
        </div>

        <span
          class="font-micro-uppercase text-micro-uppercase text-ink-secondary tracking-wider bg-surface-highlight px-3 py-1 rounded"
        >
          FORMAT PESAN OTOMATIS
        </span>
      </div>

      <!-- Variable Chips Insertion Molecule -->
      <div class="flex flex-col gap-2">
        <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary uppercase tracking-wider">
          Variabel Dinamis Tersedia (Klik untuk Menyisipkan)
        </span>
        <app-whatsapp-variable-chips (tokenSelected)="insertTokenAtCursor($event)" />
      </div>

      <!-- Template Textarea with Character Count -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <label for="template-editor" class="font-body-strong text-body-strong text-primary">
            Isi Template Pesan WhatsApp
          </label>
          <span class="font-caption text-caption text-ink-secondary" id="char-count">
            {{ store.whatsappMessageCharacterCount() }} Karakter
          </span>
        </div>
        <div class="relative">
          <textarea
            #templateTextarea
            id="template-editor"
            rows="10"
            [value]="store.whatsappMessageTemplate()"
            (input)="onTemplateInput($event)"
            class="w-full bg-surface-highlight text-primary font-mono-rate text-mono-rate p-4 rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:shadow-xs transition-all resize-y leading-relaxed border border-hairline-subtle"
            placeholder="Tulis format template pesan WhatsApp..."
          ></textarea>
        </div>
      </div>

      <!-- Granular Payload Switches (Google Maps, Breakdown, Notes) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <label
          class="flex items-center gap-3 p-3 bg-surface-highlight rounded cursor-pointer select-none min-h-[44px] hover:bg-surface-variant transition-colors"
        >
          <input
            type="checkbox"
            id="opt-gmaps"
            [checked]="store.includeGmapsLocation()"
            (change)="store.toggleGmapsOption()"
            class="w-4 h-4 rounded text-voltage-orange accent-voltage-orange focus:ring-0 cursor-pointer"
          />
          <span class="font-caption text-caption font-medium text-primary">
            Sertakan Lokasi Google Maps
          </span>
        </label>

        <label
          class="flex items-center gap-3 p-3 bg-surface-highlight rounded cursor-pointer select-none min-h-[44px] hover:bg-surface-variant transition-colors"
        >
          <input
            type="checkbox"
            id="opt-breakdown"
            [checked]="store.includeCostBreakdown()"
            (change)="store.toggleBreakdownOption()"
            class="w-4 h-4 rounded text-voltage-orange accent-voltage-orange focus:ring-0 cursor-pointer"
          />
          <span class="font-caption text-caption font-medium text-primary">
            Sertakan Rincian Ongkos
          </span>
        </label>

        <label
          class="flex items-center gap-3 p-3 bg-surface-highlight rounded cursor-pointer select-none min-h-[44px] hover:bg-surface-variant transition-colors"
        >
          <input
            type="checkbox"
            id="opt-notes"
            [checked]="store.includeSpecialNotes()"
            (change)="store.toggleNotesOption()"
            class="w-4 h-4 rounded text-voltage-orange accent-voltage-orange focus:ring-0 cursor-pointer"
          />
          <span class="font-caption text-caption font-medium text-primary">
            Sertakan Catatan Khusus
          </span>
        </label>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerWhatsAppTemplatePanelComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('templateTextarea');

  onTemplateInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    if (target) {
      this.store.setWhatsAppTemplate(target.value);
    }
  }

  insertTokenAtCursor(token: string): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea) {
      this.store.insertTokenIntoWhatsAppTemplate(token);
      return;
    }

    const cursorPos = textarea.selectionStart ?? textarea.value.length;
    this.store.insertTokenIntoWhatsAppTemplate(token, cursorPos);

    setTimeout(() => {
      textarea.focus();
      const newPos = cursorPos + token.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }
}
