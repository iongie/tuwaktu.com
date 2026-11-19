import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CreatedBusinessInquiryReceipt,
  formatRupiahIdr,
} from '../../../models/business-inquiry.model';

@Component({
  selector: 'app-business-inquiry-receipt-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-body-canvas rounded-xl p-5 sm:p-8 border border-hairline-subtle flex flex-col gap-6"
      data-testid="b2b-receipt-card"
    >
      <div class="flex items-start gap-3.5 p-4 rounded-xl bg-success-surface border border-whatsapp-green/20">
        <div class="w-11 h-11 rounded-lg bg-whatsapp-green text-white flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[24px]">check_circle</span>
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <span class="font-mono-rate text-xs font-bold uppercase tracking-wider text-whatsapp-ink">
            PENGAJUAN TERCATAT
          </span>
          <h2 class="font-heading-h2 text-heading-h2 text-ink-on-light font-bold">
            Pengajuan Klien Bisnis Berhasil Dikirim
          </h2>
          <p class="font-body-default text-body-default text-on-surface-variant">
            Simpan kode pengajuan Anda dan lanjutkan konfirmasi jadwal survei dengan Admin Tuwaktu melalui WhatsApp.
          </p>
        </div>
      </div>

      <div class="p-4 rounded-xl bg-surface-container-low border border-hairline-subtle flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hairline-subtle">
          <div class="flex flex-col">
            <span class="text-xs text-ink-secondary">Kode Pengajuan</span>
            <span class="font-mono-rate text-lg font-bold text-ink-on-light tabular-nums" data-testid="receipt-inquiry-code">
              {{ receipt().inquiry.inquiry_code }}
            </span>
          </div>
          <button
            type="button"
            (click)="copyInquiryCode()"
            class="min-h-11 px-4 py-2 rounded-lg bg-body-canvas border border-hairline-light hover:bg-surface-highlight text-ink-on-light text-xs font-bold font-mono-rate inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">content_copy</span>
            <span>{{ copied() ? 'Kode Disalin' : 'Salin Kode' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="flex flex-col">
            <span class="text-xs text-ink-secondary">Properti / Usaha</span>
            <span class="font-semibold text-ink-on-light">{{ receipt().inquiry.business_name }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-ink-secondary">Penanggung Jawab</span>
            <span class="font-semibold text-ink-on-light">{{ receipt().inquiry.contact_name }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-ink-secondary">Fokus Layanan &amp; Skala</span>
            <span class="font-semibold text-ink-on-light">
              {{ receipt().inquiry.service_focus }} ({{ receipt().inquiry.unit_count }} unit)
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-ink-secondary">Estimasi Biaya Pengelolaan</span>
            <span class="font-mono-rate font-bold text-voltage-orange tabular-nums">
              {{ formatRupiah(receipt().inquiry.estimated_monthly_fee) }} / bulan
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <a
          [href]="receipt().whatsapp_share_url"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full min-h-12 px-5 py-3 rounded-lg bg-whatsapp-green hover:bg-whatsapp-green-hover text-white font-button-label font-bold flex items-center justify-center gap-2 transition-colors no-underline"
        >
          <span class="material-symbols-outlined text-[20px]">chat</span>
          <span>Konfirmasi via WhatsApp Admin</span>
        </a>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            [href]="receipt().whatsapp_web_url"
            target="_blank"
            rel="noopener noreferrer"
            class="min-h-11 px-4 py-2.5 rounded-lg bg-surface-highlight hover:bg-surface-container border border-hairline-subtle text-ink-on-light text-xs font-bold flex items-center justify-center gap-1.5 transition-colors no-underline"
          >
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Buka WhatsApp Web</span>
          </a>

          <button
            type="button"
            (click)="createAnother.emit()"
            class="min-h-11 px-4 py-2.5 rounded-lg bg-body-canvas hover:bg-surface-highlight border border-hairline-light text-ink-on-light text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Ajukan Properti Lain</span>
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessInquiryReceiptCardComponent {
  readonly receipt = input.required<CreatedBusinessInquiryReceipt>();
  readonly createAnother = output<void>();
  readonly copied = signal<boolean>(false);

  formatRupiah(amount: number): string {
    return formatRupiahIdr(amount);
  }

  copyInquiryCode(): void {
    const code = this.receipt().inquiry.inquiry_code;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}

