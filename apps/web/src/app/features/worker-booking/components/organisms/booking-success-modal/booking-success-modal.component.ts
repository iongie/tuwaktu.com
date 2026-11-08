import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceBookingConfirmation } from '../../../models/service-booking.model';

@Component({
  selector: 'app-booking-success-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirmation(); as conf) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookingSuccessModalTitle"
        (click)="onBackdropClick($event)"
      >
        <div
          class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          (click)="$event.stopPropagation()"
        >
          <!-- Header Modal -->
          <div class="p-space-xl bg-surface-highlight border-b border-outline-variant/20 space-y-space-xs text-center relative">
            <button
              type="button"
              (click)="close.emit()"
              class="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Tutup dialog"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-surface text-success mb-1">
              <span class="material-symbols-outlined text-[28px]">check_circle</span>
            </div>

            <h2 id="bookingSuccessModalTitle" class="font-heading-h2 text-heading-h2 font-bold text-on-surface tracking-tight">
              Pemesanan Berhasil Dicatat!
            </h2>
            <p class="font-caption text-caption text-ink-secondary">
              Data reservasi telah tersimpan resmi di sistem dengan status
              <span class="font-semibold text-success">{{ conf.status || 'PENDING_WA' }}</span>
            </p>

            <!-- Booking Code Badge -->
            <div class="pt-space-xs">
              <div class="inline-flex items-center gap-space-sm bg-body-canvas px-space-md py-1.5 rounded-lg border border-outline-variant/30 shadow-sm">
                <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary font-bold uppercase">
                  Kode Reservasi:
                </span>
                <span class="font-mono-rate text-mono-rate font-bold text-voltage-orange text-base tracking-wider" id="modalBookingCode">
                  {{ conf.booking_code }}
                </span>
              </div>
            </div>
          </div>

          <!-- Rincian Pemesanan -->
          <div class="p-space-xl space-y-space-md">
            <div class="bg-surface-container-low rounded-xl p-space-md space-y-space-sm border border-outline-variant/15 text-body-default font-body-default">
              <div class="flex items-start justify-between text-caption font-caption">
                <span class="text-ink-secondary">Layanan Terpilih:</span>
                <span class="font-body-strong text-on-surface font-semibold text-right" id="modalServiceName">
                  {{ conf.service_name }}
                </span>
              </div>

              <div class="flex items-start justify-between text-caption font-caption">
                <span class="text-ink-secondary">Mitra Spesialis:</span>
                <span class="font-body-strong text-on-surface font-semibold text-right" id="modalWorkerName">
                  {{ conf.worker_name }}
                </span>
              </div>

              <div class="flex items-start justify-between text-caption font-caption">
                <span class="text-ink-secondary">Nama Pemesan:</span>
                <span class="font-body-strong text-on-surface font-semibold text-right" id="modalClientName">
                  {{ conf.client_name }}
                </span>
              </div>

              <div class="flex items-start justify-between text-caption font-caption">
                <span class="text-ink-secondary">Alamat Lokasi:</span>
                <span class="text-on-surface text-right max-w-[240px] truncate" [title]="conf.location" id="modalLocation">
                  {{ conf.location }}
                </span>
              </div>

              <div class="pt-space-xs border-t border-outline-variant/20 flex items-baseline justify-between">
                <span class="font-micro-uppercase text-micro-uppercase font-bold uppercase text-ink-secondary">
                  Total Biaya:
                </span>
                <span class="font-mono-rate text-mono-rate font-bold text-voltage-orange text-lg" id="modalTotalPrice">
                  {{ formattedTotalPrice() }}
                </span>
              </div>
            </div>

            <!-- Petunjuk Langkah Lanjutan -->
            <div class="p-space-sm bg-surface-highlight rounded-lg flex items-start gap-space-sm text-caption text-ink-secondary">
              <span class="material-symbols-outlined text-[18px] text-voltage-orange flex-shrink-0 mt-0.5">info</span>
              <span>
                Tekan tombol di bawah untuk membuka obrolan WhatsApp bersama mitra teknisi dengan format konfirmasi yang telah terisi otomatis.
              </span>
            </div>

            <!-- Tombol Aksi -->
            <div class="space-y-space-sm pt-space-xs">
              <button
                type="button"
                id="btnProceedToWhatsApp"
                (click)="proceedToWhatsApp.emit()"
                class="w-full min-h-[48px] px-space-lg rounded-xl bg-whatsapp-green hover:bg-whatsapp-green-hover text-on-primary font-button-label text-button-label font-bold flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"></path>
                </svg>
                <span>Lanjut Buka WhatsApp</span>
              </button>

              <button
                type="button"
                id="btnCloseModal"
                (click)="close.emit()"
                class="w-full min-h-[44px] px-space-md rounded-xl border border-outline-variant/40 hover:bg-surface-container text-ink-secondary hover:text-on-surface font-button-label text-button-label transition-colors cursor-pointer"
              >
                Tutup Dialog
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class BookingSuccessModalComponent {
  readonly confirmation = input.required<ServiceBookingConfirmation | null>();
  readonly whatsappUrl = input.required<string>();

  readonly proceedToWhatsApp = output<void>();
  readonly close = output<void>();

  readonly formattedTotalPrice = computed(() => {
    const total = this.confirmation()?.total_price ?? 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(total);
  });

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}

