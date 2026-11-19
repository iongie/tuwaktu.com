import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminB2BInquiryItem,
  AdminB2BInquiryStatus,
  AdminB2BPaymentStatus,
  B2B_FREQUENCY_LABELS,
  B2B_PAYMENT_STATUS_LABELS,
  B2B_PROPERTY_TYPE_LABELS,
  B2B_STATUS_LABELS,
  getB2BPlanLabel,
  UpdateAdminB2BInquiryPayload,
} from '../../../models/admin-b2b-inquiry.model';
import { formatRupiahIdr } from '../../../../business-client/models/business-inquiry.model';

@Component({
  selector: 'app-admin-b2b-inquiry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: {
    '(document:keydown.escape)': 'handleEscapeKey()',
  },
  template: `
    @if (isOpen() && inquiry(); as item) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="b2b-modal-title"
        data-testid="b2b-manage-modal"
      >
        <div class="w-full max-w-2xl rounded-xl bg-body-canvas border border-hairline-light shadow-xl overflow-hidden my-auto">
          <!-- Header Modal -->
          <div class="px-5 py-4 bg-hero-canvas text-white flex items-center justify-between gap-3">
            <div class="min-w-0">
              <span class="font-mono-rate text-[11px] font-bold text-voltage-orange block">
                {{ item.inquiry_code }}
              </span>
              <h2 id="b2b-modal-title" class="font-heading-h3 text-base font-bold truncate">
                Kelola Pengajuan: {{ item.business_name }}
              </h2>
            </div>
            <button
              type="button"
              (click)="closeModal.emit()"
              aria-label="Tutup modal pengajuan"
              class="min-h-11 min-w-11 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
            <!-- Detail Ringkas Properti -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-hairline-subtle space-y-2.5 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span class="text-ink-secondary block">PIC &amp; WhatsApp</span>
                  <strong class="text-ink-on-light">{{ item.contact_name }} ({{ item.contact_whatsapp }})</strong>
                </div>
                <div>
                  <span class="text-ink-secondary block">Wilayah &amp; Jenis</span>
                  <strong class="text-ink-on-light">{{ item.city_zone }} - {{ getPropertyLabel(item.property_type) }}</strong>
                </div>
                <div>
                  <span class="text-ink-secondary block">Paket &amp; Fokus</span>
                  <strong class="text-ink-on-light">{{ getPlanLabel(item.plan_tier) }} ({{ item.unit_count }} unit, {{ getFreqLabel(item.visit_frequency) }})</strong>
                </div>
                <div>
                  <span class="text-ink-secondary block">Estimasi Awal Sistem</span>
                  <strong class="font-mono-rate text-voltage-orange">{{ formatRupiah(item.estimated_monthly_fee) }} / bulan</strong>
                </div>
              </div>
              <div class="pt-2 border-t border-hairline-subtle">
                <span class="text-ink-secondary block">Alamat Lengkap</span>
                <span class="text-ink-on-light">{{ item.property_address }}</span>
              </div>
              @if (item.notes) {
                <div class="pt-2 border-t border-hairline-subtle">
                  <span class="text-ink-secondary block">Catatan Klien</span>
                  <span class="text-ink-on-light">{{ item.notes }}</span>
                </div>
              }
              <div class="pt-2">
                <a
                  [href]="buildWhatsAppUrl(item)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-h-11 px-4 py-2 rounded-lg bg-whatsapp-green hover:bg-whatsapp-green-hover text-white text-xs font-bold inline-flex items-center gap-1.5 no-underline"
                >
                  <span class="material-symbols-outlined text-[16px]">chat</span>
                  <span>Hubungi PIC via WhatsApp</span>
                </a>
              </div>
            </div>

            <!-- Form Pembaruan Status & Pembayaran -->
            <form class="space-y-4" (ngSubmit)="submitUpdate()">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label for="modalInquiryStatus" class="text-xs font-bold text-ink-on-light">
                    Status Pengajuan / Kontrak
                  </label>
                  <select
                    id="modalInquiryStatus"
                    name="status"
                    [(ngModel)]="draftStatus"
                    class="w-full min-h-11 px-3 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none"
                  >
                    @for (st of statusOptions; track st.value) {
                      <option [value]="st.value">{{ st.label }}</option>
                    }
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="modalPaymentStatus" class="text-xs font-bold text-ink-on-light">
                    Status Pembayaran
                  </label>
                  <select
                    id="modalPaymentStatus"
                    name="paymentStatus"
                    [(ngModel)]="draftPaymentStatus"
                    class="w-full min-h-11 px-3 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none"
                  >
                    @for (pst of paymentStatusOptions; track pst.value) {
                      <option [value]="pst.value">{{ pst.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label for="modalAgreedFee" class="text-xs font-bold text-ink-on-light">
                    Nominal Final Bulanan Disepakati (Rp)
                  </label>
                  <input
                    id="modalAgreedFee"
                    name="agreedMonthlyFee"
                    type="number"
                    min="0"
                    step="1000"
                    [(ngModel)]="draftAgreedFee"
                    placeholder="Kosongkan jika masih memakai estimasi awal"
                    class="w-full min-h-11 px-3 rounded-lg bg-surface-highlight border border-hairline-light text-sm font-mono-rate text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="modalPaymentRef" class="text-xs font-bold text-ink-on-light">
                    Referensi Transfer / QRIS
                  </label>
                  <input
                    id="modalPaymentRef"
                    name="paymentReference"
                    type="text"
                    [(ngModel)]="draftPaymentRef"
                    placeholder="Contoh: BCA-TRF-20261120 atau Nomor Invoice"
                    class="w-full min-h-11 px-3 rounded-lg bg-surface-highlight border border-hairline-light text-sm font-mono-rate text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="modalAdminNotes" class="text-xs font-bold text-ink-on-light">
                  Catatan Internal Admin
                </label>
                <textarea
                  id="modalAdminNotes"
                  name="adminNotes"
                  rows="3"
                  [(ngModel)]="draftAdminNotes"
                  placeholder="Catat hasil survei, teknisi penanggung jawab, atau jadwal kunjungan berikutnya..."
                  class="w-full px-3 py-2.5 rounded-lg bg-surface-highlight border border-hairline-light text-sm text-ink-on-light focus:bg-body-canvas focus:border-accent-link focus:outline-none resize-y"
                ></textarea>
              </div>

              <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2 border-t border-hairline-subtle">
                <button
                  type="button"
                  (click)="closeModal.emit()"
                  class="min-h-11 px-4 py-2 rounded-lg bg-surface-highlight hover:bg-surface-container border border-hairline-light text-ink-on-light text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  [disabled]="isSubmitting()"
                  data-testid="save-b2b-modal-btn"
                  class="min-h-11 px-5 py-2 rounded-lg bg-voltage-orange hover:bg-secondary text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  @if (isSubmitting()) {
                    <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Menyimpan...</span>
                  } @else {
                    <span class="material-symbols-outlined text-[18px]">save</span>
                    <span>Simpan Perubahan</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminB2BInquiryModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly inquiry = input<AdminB2BInquiryItem | null>(null);
  readonly isSubmitting = input<boolean>(false);

  readonly closeModal = output<void>();
  readonly saveUpdate = output<{
    id: string;
    payload: UpdateAdminB2BInquiryPayload;
  }>();

  draftStatus: AdminB2BInquiryStatus = 'NEW';
  draftPaymentStatus: AdminB2BPaymentStatus = 'UNPAID';
  draftAgreedFee: number | null = null;
  draftPaymentRef = '';
  draftAdminNotes = '';

  readonly statusOptions = (
    Object.keys(B2B_STATUS_LABELS) as AdminB2BInquiryStatus[]
  ).map((value) => ({
    value,
    label: B2B_STATUS_LABELS[value],
  }));

  readonly paymentStatusOptions = (
    Object.keys(B2B_PAYMENT_STATUS_LABELS) as AdminB2BPaymentStatus[]
  ).map((value) => ({
    value,
    label: B2B_PAYMENT_STATUS_LABELS[value],
  }));

  constructor() {
    effect(() => {
      const current = this.inquiry();
      if (current) {
        this.draftStatus = current.status;
        this.draftPaymentStatus = current.payment_status;
        this.draftAgreedFee =
          current.agreed_monthly_fee !== undefined ? current.agreed_monthly_fee : null;
        this.draftPaymentRef = current.payment_reference || '';
        this.draftAdminNotes = current.admin_notes || '';
      }
    });
  }

  handleEscapeKey(): void {
    if (this.isOpen()) {
      this.closeModal.emit();
    }
  }

  submitUpdate(): void {
    const current = this.inquiry();
    if (!current) {
      return;
    }

    const payload: UpdateAdminB2BInquiryPayload = {
      status: this.draftStatus,
      payment_status: this.draftPaymentStatus,
      agreed_monthly_fee:
        this.draftAgreedFee !== null && this.draftAgreedFee >= 0
          ? Number(this.draftAgreedFee)
          : undefined,
      payment_reference: this.draftPaymentRef.trim(),
      admin_notes: this.draftAdminNotes.trim(),
    };

    this.saveUpdate.emit({ id: current.id, payload });
  }

  formatRupiah(value: number): string {
    return formatRupiahIdr(value);
  }

  getPropertyLabel(val: AdminB2BInquiryItem['property_type']): string {
    return B2B_PROPERTY_TYPE_LABELS[val] || val;
  }

  getFreqLabel(val: AdminB2BInquiryItem['visit_frequency']): string {
    return B2B_FREQUENCY_LABELS[val] || val;
  }

  getPlanLabel(val: AdminB2BInquiryItem['plan_tier']): string {
    return getB2BPlanLabel(val);
  }

  buildWhatsAppUrl(item: AdminB2BInquiryItem): string {
    const clean = (item.contact_whatsapp || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Halo ${item.contact_name}, saya Admin Tuwaktu menindaklanjuti pengajuan Paket Klien Bisnis ${item.business_name} (${item.inquiry_code}).`,
    );
    return `https://wa.me/${clean}?text=${msg}`;
  }
}

