import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminWorkerListItem } from '../../../models/admin-worker.model';
import { AdminWorkerStatusBadgeComponent } from '../../molecules/admin-worker-status-badge/admin-worker-status-badge.component';

@Component({
  selector: 'app-admin-workers-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AdminWorkerStatusBadgeComponent],
  template: `
    <div class="w-full overflow-hidden rounded-2xl border border-hairline-subtle bg-surface shadow-xs">
      @if (workers().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-workers-state">
          <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-on-surface mb-1">Belum Ada Data Mitra</h3>
          <p class="text-sm text-on-surface-variant max-w-sm mb-6">
            Tidak ditemukan mitra dengan kriteria pencarian saat ini, atau belum ada mitra terdaftar.
          </p>
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            (click)="addWorkerClick.emit()"
            data-testid="empty-add-worker-btn"
          >
            + Tambah Mitra Pertama
          </button>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-hairline bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <th scope="col" class="py-3.5 px-4 md:px-6">Mitra</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Kontak & Zona</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Tarif Dasar</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Status Akun</th>
                <th scope="col" class="py-3.5 px-4 md:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline text-sm">
              @for (worker of workers(); track worker.account_id) {
                <tr class="hover:bg-surface-container-low/60 transition group">
                  <!-- Kolom Profil Mitra -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 overflow-hidden">
                        @if (worker.avatar_url) {
                          <img [src]="worker.avatar_url" [alt]="worker.name" class="w-full h-full object-cover" />
                        } @else {
                          <span>{{ worker.name.charAt(0).toUpperCase() }}</span>
                        }
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-on-surface truncate">{{ worker.name }}</div>
                        <div class="text-xs text-on-surface-variant truncate">
                          <a
                            [routerLink]="['/', worker.slug]"
                            target="_blank"
                            class="text-primary hover:underline inline-flex items-center gap-1 font-mono"
                            title="Buka profil publik"
                          >
                            /{{ worker.slug }}
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Kolom Kontak & Zona -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="text-xs text-on-surface font-medium">{{ worker.email }}</div>
                    <div class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 font-mono">
                      <span>WA: {{ worker.whatsapp_number || worker.phone_number }}</span>
                    </div>
                    <div class="text-xs text-on-surface-variant mt-1 font-medium text-emerald-700 dark:text-emerald-400">
                      {{ worker.zone || 'Wilayah Belum Diatur' }}
                    </div>
                  </td>

                  <!-- Kolom Tarif -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="font-semibold text-on-surface font-mono">
                      Rp {{ worker.base_price.toLocaleString('id-ID') }}
                    </div>
                    <div class="text-[11px] text-on-surface-variant uppercase">
                      {{ worker.rate_type === 'HOURLY' ? 'Per Jam' : 'Per Sesi' }}
                    </div>
                  </td>

                  <!-- Kolom Status -->
                  <td class="py-4 px-4 md:px-6">
                    <app-admin-worker-status-badge [status]="worker.account_status" />
                  </td>

                  <!-- Kolom Aksi -->
                  <td class="py-4 px-4 md:px-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      @if (worker.account_status === 'ACTIVE') {
                        <button
                          type="button"
                          class="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition cursor-pointer"
                          (click)="toggleStatusClick.emit(worker)"
                          [attr.data-testid]="'suspend-btn-' + worker.slug"
                          title="Tangguhkan akun mitra ini agar tidak menerima booking publik"
                        >
                          Tangguhkan
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold transition cursor-pointer"
                          (click)="toggleStatusClick.emit(worker)"
                          [attr.data-testid]="'activate-btn-' + worker.slug"
                          title="Aktifkan kembali akun mitra ini"
                        >
                          Aktifkan
                        </button>
                      }
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
})
export class AdminWorkersTableComponent {
  readonly workers = input<AdminWorkerListItem[]>([]);
  readonly addWorkerClick = output<void>();
  readonly toggleStatusClick = output<AdminWorkerListItem>();
}

