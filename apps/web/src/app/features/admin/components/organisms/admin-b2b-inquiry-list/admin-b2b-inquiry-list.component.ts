import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminB2BInquiryItem,
  B2B_FREQUENCY_LABELS,
  B2B_PROPERTY_TYPE_LABELS,
  getB2BPlanLabel,
} from '../../../models/admin-b2b-inquiry.model';
import { formatRupiahIdr } from '../../../../business-client/models/business-inquiry.model';
import { AdminB2BStatusBadgeComponent } from '../../molecules/admin-b2b-status-badge/admin-b2b-status-badge.component';

@Component({
  selector: 'app-admin-b2b-inquiry-list',
  standalone: true,
  imports: [CommonModule, AdminB2BStatusBadgeComponent],
  template: `
    <div class="w-full rounded-[10px] border border-hairline-light bg-body-canvas overflow-hidden">
      @if (isLoading()) {
        <div class="p-4 sm:p-6 space-y-3" data-testid="b2b-loading-skeleton">
          @for (skeletonRow of [1, 2, 3]; track skeletonRow) {
            <div class="h-24 rounded-lg bg-surface-highlight animate-pulse border border-hairline-subtle"></div>
          }
        </div>
      } @else if (inquiries().length === 0) {
        <div class="flex flex-col items-center justify-center p-10 text-center" data-testid="b2b-empty-state">
          <div class="w-12 h-12 rounded-lg bg-surface-highlight border border-hairline-light flex items-center justify-center text-ink-secondary mb-3">
            <span class="material-symbols-outlined text-2xl">apartment</span>
          </div>
          <h3 class="text-base font-bold text-ink-on-light mb-1">
            {{ hasActiveFilter() ? 'Pengajuan Tidak Ditemukan' : 'Belum Ada Pengajuan Klien Bisnis' }}
          </h3>
          <p class="text-xs text-ink-secondary max-w-md mb-5">
            {{
              hasActiveFilter()
                ? 'Tidak ada data pengajuan properti B2B yang cocok dengan filter status atau kata kunci saat ini.'
                : 'Pengajuan paket pengelolaan kos, kantor, dan ruko dari halaman /bisnis akan muncul otomatis di sini.'
            }}
          </p>
          @if (hasActiveFilter()) {
            <button
              type="button"
              (click)="resetFilters.emit()"
              class="min-h-11 px-4 py-2 rounded-lg bg-hero-canvas text-white text-xs font-bold font-mono-rate cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              Reset Semua Filter
            </button>
          }
        </div>
      } @else {
        <!-- Tampilan Mobile & Tablet (< lg): Kartu Tumpuk Bebas Overflow Horizontal -->
        <div class="lg:hidden divide-y divide-hairline-light" data-testid="b2b-mobile-cards">
          @for (item of inquiries(); track item.id) {
            <article class="p-4 flex flex-col gap-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <span class="font-mono-rate text-xs font-bold text-voltage-orange block">
                    {{ item.inquiry_code }}
                  </span>
                  <h3 class="font-bold text-sm text-ink-on-light truncate">
                    {{ item.business_name }}
                  </h3>
                  <span class="text-xs text-ink-secondary">
                    {{ getPropertyLabel(item.property_type) }} - {{ item.city_zone }}
                  </span>
                </div>
                <span class="font-mono-rate text-sm font-bold text-ink-on-light shrink-0 tabular-nums">
                  {{ formatRupiah(item.agreed_monthly_fee ?? item.estimated_monthly_fee) }}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <app-admin-b2b-status-badge kind="inquiry" [value]="item.status" />
                <app-admin-b2b-status-badge kind="payment" [value]="item.payment_status" />
              </div>

              <div class="text-xs text-ink-secondary flex flex-wrap gap-x-4 gap-y-1">
                <span>PIC: <strong class="text-ink-on-light">{{ item.contact_name }}</strong></span>
                <span>{{ item.unit_count }} unit ({{ getFreqLabel(item.visit_frequency) }})</span>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  (click)="manageClick.emit(item)"
                  class="min-h-11 px-3 py-2 rounded-lg bg-hero-canvas hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>Kelola</span>
                </button>
                <a
                  [href]="buildWhatsAppUrl(item)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-h-11 px-3 py-2 rounded-lg bg-whatsapp-green hover:bg-whatsapp-green-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 no-underline"
                >
                  <span class="material-symbols-outlined text-[16px]">chat</span>
                  <span>Chat PIC</span>
                </a>
              </div>
            </article>
          }
        </div>

        <!-- Tampilan Desktop (>= lg): Tabel Data Penuh -->
        <div class="hidden lg:block overflow-x-auto" data-testid="b2b-desktop-table">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-highlight text-ink-secondary text-[11px] font-mono-rate font-bold uppercase tracking-wider border-b border-hairline-light">
                <th scope="col" class="py-3.5 px-5">KODE &amp; PROPERTI</th>
                <th scope="col" class="py-3.5 px-4">PIC &amp; WILAYAH</th>
                <th scope="col" class="py-3.5 px-4">PAKET &amp; UNIT</th>
                <th scope="col" class="py-3.5 px-4">BIAYA BULANAN</th>
                <th scope="col" class="py-3.5 px-4">STATUS KONTRAK</th>
                <th scope="col" class="py-3.5 px-4">PEMBAYARAN</th>
                <th scope="col" class="py-3.5 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-light text-xs text-ink-on-light">
              @for (item of inquiries(); track item.id) {
                <tr class="hover:bg-surface-highlight/60 transition-colors">
                  <td class="py-4 px-5 align-top">
                    <span class="font-mono-rate text-[11px] font-bold text-voltage-orange block">
                      {{ item.inquiry_code }}
                    </span>
                    <span class="font-bold text-sm text-ink-on-light block">
                      {{ item.business_name }}
                    </span>
                    <span class="text-xs text-ink-secondary">
                      {{ getPropertyLabel(item.property_type) }}
                    </span>
                  </td>

                  <td class="py-4 px-4 align-top">
                    <span class="font-semibold text-ink-on-light block">{{ item.contact_name }}</span>
                    <span class="font-mono-rate text-[11px] text-ink-secondary block">{{ item.contact_whatsapp }}</span>
                    <span class="text-xs text-ink-secondary">{{ item.city_zone }}</span>
                  </td>

                  <td class="py-4 px-4 align-top">
                    <span class="font-semibold text-ink-on-light block">{{ getPlanLabel(item.plan_tier) }}</span>
                    <span class="text-xs text-ink-secondary block">{{ item.service_focus }}</span>
                    <span class="font-mono-rate text-[11px] text-ink-secondary">
                      {{ item.unit_count }} unit - {{ getFreqLabel(item.visit_frequency) }}
                    </span>
                  </td>

                  <td class="py-4 px-4 align-top">
                    <span class="font-mono-rate text-sm font-bold text-ink-on-light tabular-nums block">
                      {{ formatRupiah(item.agreed_monthly_fee ?? item.estimated_monthly_fee) }}
                    </span>
                    <span class="text-[11px] text-ink-secondary">
                      {{ item.agreed_monthly_fee != null ? 'Disepakati' : 'Estimasi awal' }}
                    </span>
                  </td>

                  <td class="py-4 px-4 align-top">
                    <app-admin-b2b-status-badge kind="inquiry" [value]="item.status" />
                  </td>

                  <td class="py-4 px-4 align-top">
                    <div class="flex flex-col gap-1 items-start">
                      <app-admin-b2b-status-badge kind="payment" [value]="item.payment_status" />
                      @if (item.payment_reference) {
                        <span class="font-mono-rate text-[10px] text-ink-secondary">
                          Ref: {{ item.payment_reference }}
                        </span>
                      }
                    </div>
                  </td>

                  <td class="py-4 px-5 align-top text-right">
                    <div class="inline-flex items-center gap-2">
                      <a
                        [href]="buildWhatsAppUrl(item)"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Hubungi PIC via WhatsApp"
                        class="min-h-11 px-3 py-2 rounded-lg bg-whatsapp-surface hover:bg-whatsapp-green hover:text-white text-whatsapp-ink text-xs font-bold inline-flex items-center gap-1 transition-colors no-underline"
                      >
                        <span class="material-symbols-outlined text-[16px]">chat</span>
                        <span>WA</span>
                      </a>
                      <button
                        type="button"
                        (click)="manageClick.emit(item)"
                        class="min-h-11 px-3.5 py-2 rounded-lg bg-hero-canvas hover:bg-neutral-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span class="material-symbols-outlined text-[16px]">edit_note</span>
                        <span>Kelola</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminB2BInquiryListComponent {
  readonly inquiries = input.required<readonly AdminB2BInquiryItem[]>();
  readonly isLoading = input<boolean>(false);
  readonly hasActiveFilter = input<boolean>(false);

  readonly manageClick = output<AdminB2BInquiryItem>();
  readonly resetFilters = output<void>();

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

