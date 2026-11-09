import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { resolveAvatarUrl } from '../../../../../core/utils/avatar-url.util';
import { AdminWorkerListItem } from '../../../models/admin-worker.model';
import { AdminWorkerStatusBadgeComponent } from '../../molecules/admin-worker-status-badge/admin-worker-status-badge.component';

@Component({
  selector: 'app-admin-workers-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AdminWorkerStatusBadgeComponent],
  template: `
    <div class="w-full overflow-hidden rounded-[10px] border border-hairline-light bg-body-canvas shadow-none">
      @if (workers().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-workers-state">
          <div class="w-12 h-12 rounded bg-surface-highlight border border-hairline-light flex items-center justify-center text-ink-secondary mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-ink-on-light mb-1">Belum Ada Data Mitra</h3>
          <p class="text-xs text-ink-secondary max-w-sm mb-6">
            Tidak ditemukan mitra dengan kriteria pencarian saat ini, atau belum ada mitra terdaftar.
          </p>
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded bg-hero-canvas text-ink-on-dark text-xs font-bold uppercase tracking-wider font-mono-rate hover:bg-[#262626] transition cursor-pointer"
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
              <tr class="border-b border-hairline-light bg-surface-highlight text-xs font-bold text-ink-on-light uppercase tracking-wider font-mono-rate">
                <th scope="col" class="py-3.5 px-4 md:px-6">Mitra</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Kontak &amp; Zona</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Tarif Dasar</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Status Akun</th>
                <th scope="col" class="py-3.5 px-4 md:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-light text-sm">
              @for (worker of workers(); track worker.account_id) {
                <tr class="hover:bg-surface-highlight/60 transition group">
                  <!-- Kolom Profil Mitra -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full bg-surface-highlight border border-hairline-light text-ink-on-light font-bold flex items-center justify-center shrink-0 overflow-hidden font-mono-rate text-xs">
                        @if (worker.avatar_url) {
                          <img
                            [src]="resolveUrl(worker.avatar_url)"
                            [alt]="worker.name"
                            (error)="onImgError($event)"
                            class="w-full h-full object-cover"
                          />
                          <span class="hidden">{{ worker.name.charAt(0).toUpperCase() }}</span>
                        } @else {
                          <span>{{ worker.name.charAt(0).toUpperCase() }}</span>
                        }
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-ink-on-light truncate">{{ worker.name }}</div>
                        <div class="text-xs text-ink-secondary truncate">
                          <a
                            [routerLink]="['/', worker.slug]"
                            target="_blank"
                            class="text-ink-on-light hover:underline inline-flex items-center gap-1 font-mono-rate"
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
                    <div class="text-xs text-ink-on-light font-medium">{{ worker.email }}</div>
                    <div class="text-xs text-ink-secondary flex items-center gap-1 mt-0.5 font-mono-rate">
                      <span>WA: {{ worker.whatsapp_number || worker.phone_number }}</span>
                    </div>
                    <div class="text-xs text-ink-secondary mt-1 font-medium font-mono-rate">
                      {{ worker.zone || 'Wilayah Belum Diatur' }}
                    </div>
                  </td>

                  <!-- Kolom Tarif -->
                  <td class="py-4 px-4 md:px-6">
                    <a
                      [routerLink]="['/dashboard/tarif-layanan']"
                      [queryParams]="{ slug: worker.slug }"
                      class="group/rate inline-block text-left"
                      title="Kelola Tarif & Layanan {{ worker.name }}"
                    >
                      <div class="font-bold text-ink-on-light font-mono-rate tabular-nums group-hover/rate:underline">
                        Rp {{ worker.base_price.toLocaleString('id-ID') }}
                      </div>
                      <div class="text-[10px] text-ink-secondary uppercase font-mono-rate">
                        {{ worker.rate_type === 'HOURLY' ? 'Per Jam' : 'Per Sesi' }}
                      </div>
                    </a>
                  </td>

                  <!-- Kolom Status -->
                  <td class="py-4 px-4 md:px-6">
                    <app-admin-worker-status-badge [status]="worker.account_status" />
                  </td>

                  <!-- Kolom Aksi -->
                  <td class="py-4 px-4 md:px-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <a
                        [routerLink]="['/dashboard/tarif-layanan']"
                        [queryParams]="{ slug: worker.slug }"
                        class="min-h-[38px] px-3 py-1.5 rounded border border-hairline-light text-ink-on-light hover:bg-surface-highlight text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer inline-flex items-center gap-1"
                        title="Kelola Tarif & Layanan Mitra"
                        [attr.data-testid]="'manage-rates-btn-' + worker.slug"
                      >
                        <span class="material-symbols-outlined text-[16px]">payments</span>
                        <span class="hidden md:inline">Tarif &amp; Layanan</span>
                      </a>
                      <a
                        [routerLink]="['/dashboard/kalender-slot']"
                        [queryParams]="{ slug: worker.slug }"
                        class="min-h-[38px] px-3 py-1.5 rounded border border-hairline-light text-ink-on-light hover:bg-surface-highlight text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer inline-flex items-center gap-1"
                        title="Kelola Kalender & Slot Mitra"
                        [attr.data-testid]="'manage-schedule-btn-' + worker.slug"
                      >
                        <span class="material-symbols-outlined text-[16px]">calendar_month</span>
                        <span class="hidden md:inline">Kalender &amp; Slot</span>
                      </a>
                      @if (worker.account_status === 'ACTIVE') {
                        <button
                          type="button"
                          class="min-h-[38px] px-3.5 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer"
                          (click)="toggleStatusClick.emit(worker)"
                          [attr.data-testid]="'suspend-btn-' + worker.slug"
                          title="Tangguhkan akun mitra ini agar tidak menerima booking publik"
                        >
                          Tangguhkan
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="min-h-[38px] px-3.5 py-1.5 rounded border border-whatsapp-green/40 text-whatsapp-green hover:bg-whatsapp-surface/40 text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer"
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

  resolveUrl(url: string | null | undefined): string {
    return resolveAvatarUrl(url);
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
      if (target.nextElementSibling) {
        (target.nextElementSibling as HTMLElement).classList.remove('hidden');
      }
    }
  }
}

