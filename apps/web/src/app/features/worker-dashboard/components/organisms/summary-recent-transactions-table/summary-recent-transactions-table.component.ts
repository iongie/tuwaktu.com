import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardTransactionRecord {
  id: string;
  dateTime: string;
  clientName: string;
  clientArea: string;
  serviceName: string;
  durationHours: string;
  totalReceived: string;
  status: 'Selesai' | 'Terjadwal' | 'Dibatalkan';
}

@Component({
  selector: 'app-summary-recent-transactions-table',
  standalone: true,
  imports: [CommonModule],
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
              Pencatatan langsung tanpa penahanan dana saldo
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="downloadCsv()"
          class="min-h-[44px] px-4 rounded-lg border border-hairline-subtle bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-center"
          aria-label="Unduh Rekap CSV Transaksi"
        >
          <span class="material-symbols-outlined text-[18px]">
            {{ isDownloaded() ? 'check' : 'download' }}
          </span>
          <span>{{ isDownloaded() ? 'CSV Berhasil Diunduh' : 'Unduh Rekap CSV' }}</span>
        </button>
      </div>

      <!-- Responsive Table Container -->
      <div class="overflow-x-auto -mx-5 sm:mx-0">
        <table class="w-full text-left text-xs min-w-[640px]">
          <thead>
            <tr class="border-b border-hairline-subtle bg-surface-container-low/60 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
              <th scope="col" class="py-3 px-4 sm:px-5 font-semibold">TANGGAL &amp; WAKTU</th>
              <th scope="col" class="py-3 px-4 font-semibold">KLIEN</th>
              <th scope="col" class="py-3 px-4 font-semibold">LAYANAN</th>
              <th scope="col" class="py-3 px-4 font-semibold text-center">DURASI</th>
              <th scope="col" class="py-3 px-4 font-semibold text-right">TOTAL DITERIMA</th>
              <th scope="col" class="py-3 px-4 sm:px-5 font-semibold text-right">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline-subtle">
            @for (tx of transactions(); track tx.id) {
              <tr class="hover:bg-surface-container-low/40 transition-colors">
                <!-- Tanggal & Waktu -->
                <td class="py-3.5 px-4 sm:px-5 font-mono text-on-surface whitespace-nowrap">
                  {{ tx.dateTime }}
                </td>

                <!-- Klien -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-on-surface">{{ tx.clientName }}</div>
                  <div class="text-[11px] text-on-surface-variant font-mono">{{ tx.clientArea }}</div>
                </td>

                <!-- Layanan -->
                <td class="py-3.5 px-4 font-medium text-on-surface">
                  {{ tx.serviceName }}
                </td>

                <!-- Durasi -->
                <td class="py-3.5 px-4 font-mono text-center text-on-surface-variant whitespace-nowrap">
                  {{ tx.durationHours }}
                </td>

                <!-- Total Diterima -->
                <td class="py-3.5 px-4 font-mono font-bold text-right text-on-surface whitespace-nowrap">
                  {{ tx.totalReceived }}
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                  @if (tx.status === 'Selesai') {
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      Selesai
                    </span>
                  } @else if (tx.status === 'Terjadwal') {
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      Terjadwal
                    </span>
                  } @else {
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {{ tx.status }}
                    </span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryRecentTransactionsTableComponent {
  readonly isDownloaded = signal(false);

  readonly transactions = signal<DashboardTransactionRecord[]>([
    {
      id: 'tx-01',
      dateTime: '24 Okt 2024 • 08:30',
      clientName: 'Bu Ratna K.',
      clientArea: 'Tebet Barat 1.8 Km',
      serviceName: 'Deep Cleaning',
      durationHours: '3.0 Jam',
      totalReceived: 'Rp 280.000',
      status: 'Selesai',
    },
    {
      id: 'tx-02',
      dateTime: '24 Okt 2024 • 13:00',
      clientName: 'Pak Dimas Arya',
      clientArea: 'Senopati 3.9 Km',
      serviceName: 'General Cleaning',
      durationHours: '2.5 Jam',
      totalReceived: 'Rp 216.000',
      status: 'Terjadwal',
    },
    {
      id: 'tx-03',
      dateTime: '23 Okt 2024 • 14:00',
      clientName: 'Clara Veronica',
      clientArea: 'Pancoran 2.4 Km',
      serviceName: 'Deep Cleaning',
      durationHours: '4.0 Jam',
      totalReceived: 'Rp 360.000',
      status: 'Selesai',
    },
    {
      id: 'tx-04',
      dateTime: '22 Okt 2024 • 09:00',
      clientName: 'Hendra Wijaya',
      clientArea: 'Kuningan 3.2 Km',
      serviceName: 'Sanitasi Kasur & Sofa',
      durationHours: '2.0 Jam',
      totalReceived: 'Rp 180.000',
      status: 'Selesai',
    },
  ]);

  downloadCsv(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const headers = [
      'TANGGAL & WAKTU',
      'KLIEN',
      'LOKASI / JARAK',
      'LAYANAN',
      'DURASI',
      'TOTAL DITERIMA',
      'STATUS',
    ];

    const rows = this.transactions().map((tx) => [
      tx.dateTime,
      tx.clientName,
      tx.clientArea,
      tx.serviceName,
      tx.durationHours,
      tx.totalReceived,
      tx.status,
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
