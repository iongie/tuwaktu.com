import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-whatsapp-config-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section
      class="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-5 border border-hairline-subtle"
    >
      <!-- Panel Header & Status Badge -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-whatsapp-surface flex items-center justify-center text-whatsapp-ink shrink-0"
          >
            <span class="material-symbols-outlined text-[20px]">phone_android</span>
          </div>
          <div>
            <h2 class="font-heading-3 text-heading-3 text-ink-on-light">Nomor WhatsApp Aktif</h2>
            <span class="font-caption text-caption text-ink-secondary">
              Saluran penerimaan inquiry calon klien
            </span>
          </div>
        </div>

        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-caption text-caption font-semibold self-start sm:self-auto"
          [class.bg-success-surface]="store.workerWhatsAppNumber()"
          [class.text-success]="store.workerWhatsAppNumber()"
          [class.bg-amber-50]="!store.workerWhatsAppNumber()"
          [class.text-amber-800]="!store.workerWhatsAppNumber()"
        >
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-success]="store.workerWhatsAppNumber()"
            [class.bg-amber-600]="!store.workerWhatsAppNumber()"
          ></span>
          <span>
            {{ store.workerWhatsAppNumber() ? 'Nomor Aktif' : 'Belum Dikonfigurasi' }}
          </span>
        </span>
      </div>

      <!-- Phone Number Row & Actions -->
      @if (!store.isEditingWhatsAppNumber()) {
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div
            class="sm:col-span-8 flex items-center bg-surface-highlight px-4 py-3 rounded border border-hairline-subtle"
          >
            <span class="font-mono-rate text-mono-rate text-ink-secondary mr-3 select-none">
              ID (+62)
            </span>
            <input
              type="text"
              id="phone-number"
              readonly
              [value]="store.displayFormattedWhatsAppNumber()"
              class="w-full bg-transparent font-mono-rate text-mono-rate text-primary focus:outline-none cursor-default font-bold"
              aria-label="Nomor WhatsApp aktif"
            />
            <span class="material-symbols-outlined text-success text-[18px]">verified</span>
          </div>

          <div class="sm:col-span-4 flex items-center gap-2">
            <button
              type="button"
              id="btn-change-number"
              (click)="store.startEditingWhatsAppNumber()"
              class="w-full py-2.5 px-3 bg-surface-highlight hover:bg-surface-variant text-ink-secondary hover:text-primary rounded font-button-label text-caption transition-colors text-center min-h-[44px] cursor-pointer"
            >
              Ganti Nomor
            </button>
          </div>
        </div>
      } @else {
        <!-- Inline Phone Edit Form -->
        <div class="p-4 bg-surface-highlight/70 rounded-lg border border-hairline-subtle space-y-3">
          <label for="editWhatsAppInput" class="block font-caption text-caption font-bold text-primary">
            Masukkan Nomor WhatsApp Baru (Gunakan awalan 62 atau 08):
          </label>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              id="editWhatsAppInput"
              type="tel"
              [ngModel]="store.editWhatsAppNumberInput()"
              (ngModelChange)="store.editWhatsAppNumberInput.set($event)"
              placeholder="Contoh: 6281288992211"
              class="flex-1 px-3 py-2 bg-white border border-hairline-light rounded font-mono-rate text-mono-rate text-primary focus:outline-none focus:ring-1 focus:ring-voltage-orange min-h-[44px]"
            />
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="store.saveEditedWhatsAppNumber()"
                class="px-4 py-2 bg-whatsapp-green hover:bg-whatsapp-green-hover text-on-primary rounded font-button-label text-caption transition-colors min-h-[44px] cursor-pointer font-semibold"
              >
                Simpan
              </button>
              <button
                type="button"
                (click)="store.cancelEditingWhatsAppNumber()"
                class="px-4 py-2 bg-surface-highlight hover:bg-surface-variant text-primary rounded font-button-label text-caption transition-colors min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerWhatsAppConfigPanelComponent {
  readonly store = inject(WorkerDashboardStore);
}
