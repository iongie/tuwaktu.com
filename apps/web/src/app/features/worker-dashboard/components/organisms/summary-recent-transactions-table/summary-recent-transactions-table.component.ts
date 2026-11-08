import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import {
  WorkerBookingRecord,
  WorkerBookingStatus,
} from '../../../models/worker-profile.model';

@Component({
  selector: 'app-summary-recent-transactions-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section
      class="bg-surface-container-lowest border border-hairline-subtle rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 overflow-hidden"
    >
      <!-- Table Header & Action -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline-subtle">
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100"
          >
            <span class="material-symbols-outlined text-[20px]">receipt_long</span>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-on-surface">
              Riwayat Aktivitas &amp; Transaksi Terkini
            </h2>
            <p class="text-xs text-on-surface-variant mt-0.5">
              Pencatatan langsung pesanan masuk tanpa penahanan dana saldo
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="downloadCsv()"
          [disabled]="store.filteredWorkerBookings().length === 0"
          [class.opacity-50]="store.filteredWorkerBookings().length === 0"
          [class.cursor-not-allowed]="store.filteredWorkerBookings().length === 0"
          class="min-h-[44px] px-4 rounded-lg border border-hairline-subtle bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-center"
          aria-label="Unduh Rekap CSV Transaksi"
        >
          <span class="material-symbols-outlined text-[18px]">
            {{ isDownloaded() ? 'check' : 'download' }}
          </span>
          <span>{{ isDownloaded() ? 'CSV Berhasil Diunduh' : 'Unduh Rekap CSV' }}</span>
        </button>
      </div>

      <!-- Filter Tabs & Quick Search Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <!-- Status Filter Chips -->
        <div class="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter status pesanan">
          <button
            type="button"
            (click)="store.setBookingFilterStatus('ALL')"
            [class]="store.bookingFilterStatus() === 'ALL'
              ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-on-surface text-surface shadow-xs transition-colors'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer'"
          >
            Semua ({{ store.bookingStatusCounts().ALL }})
          </button>

          <button
            type="button"
            (click)="store.setBookingFilterStatus('PENDING_WA')"
            [class]="store.bookingFilterStatus() === 'PENDING_WA'
              ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 text-white shadow-xs transition-colors'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer'"
          >
            Menunggu WA ({{ store.bookingStatusCounts().PENDING_WA }})
          </button>

          <button
            type="button"
            (click)="store.setBookingFilterStatus('CONFIRMED')"
            [class]="store.bookingFilterStatus() === 'CONFIRMED'
              ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-700 text-white shadow-xs transition-colors'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium text-sky-800 hover:bg-sky-50 transition-colors cursor-pointer'"
          >
            Terjadwal ({{ store.bookingStatusCounts().CONFIRMED }})
          </button>

          <button
            type="button"
            (click)="store.setBookingFilterStatus('COMPLETED')"
            [class]="store.bookingFilterStatus() === 'COMPLETED'
              ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white shadow-xs transition-colors'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer'"
          >
            Selesai ({{ store.bookingStatusCounts().COMPLETED }})
          </button>

          <button
            type="button"
            (click)="store.setBookingFilterStatus('CANCELLED')"
            [class]="store.bookingFilterStatus() === 'CANCELLED'
              ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 text-white shadow-xs transition-colors'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'"
          >
            Dibatalkan ({{ store.bookingStatusCounts().CANCELLED }})
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-64">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-ink-disabled text-[18px]">
            search
          </span>
          <input
            type="text"
            [ngModel]="store.bookingSearchQuery()"
            (ngModelChange)="store.setBookingSearchQuery($event)"
            placeholder="Cari pemesan atau kode..."
            class="w-full h-9 pl-9 pr-3 bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-ink-disabled font-body-default text-xs rounded-lg transition-all outline-none border border-hairline-subtle focus:border-voltage-orange"
          />
        </div>
      </div>

      <!-- Responsive Table Container / Loading / Empty State -->
      @if (store.isBookingsLoading()) {
        <!-- Skeleton Loader (Anti-Slop) -->
        <div class="space-y-3 py-4 animate-pulse">
          <div class="h-10 bg-surface-container-low rounded-lg w-full"></div>
          <div class="h-12 bg-surface-container-low rounded-lg w-full"></div>
          <div class="h-12 bg-surface-container-low rounded-lg w-full"></div>
        </div>
      } @else if (store.filteredWorkerBookings().length === 0) {
        <div class="py-10 text-center flex flex-col items-center justify-center space-y-3">
          <div
            class="w-12 h-12 rounded-2xl bg-surface-container-low border border-hairline-subtle flex items-center justify-center text-on-surface-variant"
          >
            <span class="material-symbols-outlined text-[26px]">receipt_long</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-on-surface">
              {{ store.bookingFilterStatus() !== 'ALL' || store.bookingSearchQuery()
                ? 'Tidak Ada Pesanan yang Sesuai'
                : 'Belum Ada Riwayat Pemesanan' }}
            </h3>
            <p class="text-xs text-on-surface-variant max-w-sm">
              {{ store.bookingFilterStatus() !== 'ALL' || store.bookingSearchQuery()
                ? 'Silakan sesuaikan kata kunci pencarian atau ubah tab filter status di atas.'
                : 'Pencatatan riil pemesanan mandiri oleh pelanggan akan otomatis muncul di sini tanpa potongan komisi.' }}
            </p>
          </div>
        </div>
      } @else {
        <div class="overflow-x-auto -mx-5 sm:mx-0">
          <table class="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr class="border-b border-hairline-subtle bg-surface-container-low/60 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
                <th scope="col" class="py-3 px-4 sm:px-5 font-semibold">TANGGAL &amp; KODE</th>
                <th scope="col" class="py-3 px-4 font-semibold">KLIEN &amp; KONTAK</th>
                <th scope="col" class="py-3 px-4 font-semibold">LAYANAN</th>
                <th scope="col" class="py-3 px-4 font-semibold text-right">TOTAL DITERIMA</th>
                <th scope="col" class="py-3 px-4 font-semibold text-center">STATUS</th>
                <th scope="col" class="py-3 px-4 sm:px-5 font-semibold text-right">AKSI CEPAT</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-subtle">
              @for (b of store.filteredWorkerBookings(); track b.id) {
                <tr class="hover:bg-surface-container-low/40 transition-colors">
                  <!-- Tanggal & Kode Booking -->
                  <td class="py-3.5 px-4 sm:px-5 font-mono text-on-surface whitespace-nowrap">
                    <div class="font-bold">{{ formatBookingDateTime(b) }}</div>
                    <div class="text-[11px] text-voltage-orange font-semibold tracking-wider">
                      {{ b.booking_code }}
                    </div>
                  </td>

                  <!-- Klien & Kontak -->
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-on-surface">{{ b.client_name }}</div>
                    <div class="text-[11px] text-on-surface-variant truncate max-w-[200px]" [title]="b.location">
                      {{ b.location }}
                    </div>
                    @if (b.client_phone) {
                      <div class="pt-1">
                        <a
                          [href]="buildWhatsAppClientUrl(b.client_phone, b.client_name, b.booking_code)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <span class="material-symbols-outlined text-[13px]">chat</span>
                          <span>{{ b.client_phone }}</span>
                        </a>
                      </div>
                    }
                  </td>

                  <!-- Layanan & Durasi -->
                  <td class="py-3.5 px-4 font-medium text-on-surface">
                    <div>{{ b.service_name || 'Layanan Mandiri' }}</div>
                    <div class="text-[11px] text-on-surface-variant font-mono">
                      Durasi {{ (b.duration_minutes / 60).toFixed(1) }} jam
                    </div>
                  </td>

                  <!-- Total Diterima -->
                  <td class="py-3.5 px-4 font-mono font-bold text-right text-on-surface whitespace-nowrap">
                    {{ formatCurrency(b.total_price) }}
                  </td>

                  <!-- Status Visual Badge -->
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    @if (b.status === 'PENDING_WA') {
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200"
                      >
                        Menunggu WA
                      </span>
                    } @else if (b.status === 'CONFIRMED') {
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200"
                      >
                        Terjadwal
                      </span>
                    } @else if (b.status === 'COMPLETED') {
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        Selesai
                      </span>
                    } @else if (b.status === 'CANCELLED') {
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        Dibatalkan
                      </span>
                    } @else {
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {{ b.status }}
                      </span>
                    }
                  </td>

                  <!-- Aksi Cepat Mutasi Status -->
                  <td class="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                      @if (b.status === 'PENDING_WA') {
                        <button
                          type="button"
                          [disabled]="store.isUpdatingBookingStatus() === b.id"
                          (click)="onUpdateStatus(b.id, 'CONFIRMED')"
                          class="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-[11px] border border-sky-200 transition-colors cursor-pointer"
                          title="Tandai pesanan telah terkonfirmasi"
                        >
                          Konfirmasi
                        </button>
                        <button
                          type="button"
                          [disabled]="store.isUpdatingBookingStatus() === b.id"
                          (click)="onUpdateStatus(b.id, 'CANCELLED')"
                          class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-medium text-[11px] transition-colors cursor-pointer"
                          title="Batalkan pesanan ini"
                        >
                          Batal
                        </button>
                      } @else if (b.status === 'CONFIRMED') {
                        <button
                          type="button"
                          [disabled]="store.isUpdatingBookingStatus() === b.id"
                          (click)="onUpdateStatus(b.id, 'COMPLETED')"
                          class="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                          title="Tandai pekerjaan telah tuntas diselesaikan"
                        >
                          Selesai
                        </button>
                        <button
                          type="button"
                          [disabled]="store.isUpdatingBookingStatus() === b.id"
                          (click)="onUpdateStatus(b.id, 'CANCELLED')"
                          class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-medium text-[11px] transition-colors cursor-pointer"
                          title="Batalkan pesanan ini"
                        >
                          Batal
                        </button>
                      } @else {
                        <span class="text-[11px] text-ink-disabled font-mono italic">
                          Tuntas
                        </span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryRecentTransactionsTableComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly isDownloaded = signal(false);

  formatBookingDateTime(b: WorkerBookingRecord): string {
    const raw = b.booking_date;
    if (!raw) return '-';
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;

    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    let timeStr = '';
    if (b.start_time) {
      const start = new Date(b.start_time);
      if (!isNaN(start.getTime())) {
        const h = String(start.getHours()).padStart(2, '0');
        const m = String(start.getMinutes()).padStart(2, '0');
        timeStr = `, ${h}:${m} WIB`;
      }
    }
    return `${day} ${month} ${year}${timeStr}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  buildWhatsAppClientUrl(
    phone: string,
    clientName: string,
    bookingCode: string,
  ): string {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const text = encodeURIComponent(
      `Halo ${clientName}, ini mitra teknisi Tuwaktu mengenai pesanan dengan kode ${bookingCode}.`,
    );
    return `https://wa.me/${clean}?text=${text}`;
  }

  onUpdateStatus(bookingId: string, status: WorkerBookingStatus): void {
    this.store.updateBookingStatus(bookingId, status);
  }

  downloadCsv(): void {
    const list = this.store.filteredWorkerBookings();
    if (list.length === 0) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const headers = [
      'TANGGAL & WAKTU',
      'KODE RESERVASI',
      'KLIEN',
      'NO WHATSAPP',
      'LOKASI / AREA',
      'LAYANAN',
      'DURASI (JAM)',
      'TOTAL DITERIMA (RP)',
      'STATUS',
      'CATATAN',
    ];

    const rows = list.map((b) => [
      this.formatBookingDateTime(b),
      b.booking_code,
      b.client_name,
      b.client_phone || '-',
      b.location,
      b.service_name || 'Layanan Mandiri',
      (b.duration_minutes / 60).toFixed(1),
      String(b.total_price),
      b.status,
      b.notes || '-',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'rekap-transaksi-tuwaktu.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }

    this.isDownloaded.set(true);
    setTimeout(() => this.isDownloaded.set(false), 2500);
  }
}
