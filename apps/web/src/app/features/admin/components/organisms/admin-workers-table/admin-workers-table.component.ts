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
    <div class="w-full overflow-hidden rounded-[10px] border border-hairline-light bg-body-canvas shadow-none mb-6">
      @if (workers().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-workers-state">
          <div class="w-12 h-12 rounded bg-surface-highlight border border-hairline-light flex items-center justify-center text-ink-secondary mb-4">
            <span class="material-symbols-outlined text-[24px]">group_off</span>
          </div>
          <h3 class="text-base font-bold text-ink-on-light mb-1">Belum Ada Data Mitra</h3>
          <p class="text-xs text-ink-secondary max-w-sm mb-6">
            Tidak ditemukan mitra dengan kriteria pencarian saat ini, atau belum ada mitra terdaftar.
          </p>
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded bg-hero-canvas text-ink-on-dark text-xs font-bold uppercase tracking-wider font-mono-rate hover:bg-neutral-800 transition cursor-pointer"
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
              <tr class="bg-surface-highlight text-ink-secondary text-[11px] font-mono-rate font-bold uppercase tracking-wider border-b border-hairline-light">
                <th scope="col" class="py-3.5 px-4 md:px-6">PROFIL &amp; KREDENSIAL</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">KONTAK &amp; BASECAMP ZONA</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">TARIF DASAR &amp; SKEMA</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">STATUS AKUN</th>
                <th scope="col" class="py-3.5 px-4 md:px-6 text-right">AKSI KONTROL CEPAT</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-light text-ink-on-light text-xs font-mono-rate">
              @for (worker of workers(); track worker.account_id) {
                <tr
                  class="hover:bg-surface-highlight/60 transition-colors"
                  [class.bg-red-50/20]="worker.account_status === 'SUSPENDED'"
                >
                  <!-- Profil & Kredensial -->
                  <td class="py-4 px-4 md:px-6 align-top">
                    <div class="flex items-start gap-3">
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden text-xs"
                        [class.bg-hero-canvas]="worker.account_status === 'ACTIVE'"
                        [class.text-ink-on-dark]="worker.account_status === 'ACTIVE'"
                        [class.bg-red-100]="worker.account_status === 'SUSPENDED'"
                        [class.text-red-700]="worker.account_status === 'SUSPENDED'"
                      >
                        @if (worker.avatar_url) {
                          <img
                            [src]="resolveUrl(worker.avatar_url)"
                            [alt]="worker.name"
                            (error)="onImgError($event)"
                            class="w-full h-full object-cover"
                          />
                          <span class="hidden">{{ getInitials(worker.name) }}</span>
                        } @else {
                          <span>{{ getInitials(worker.name) }}</span>
                        }
                      </div>
                      <div class="flex flex-col min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-ink-on-light truncate text-sm font-sans">{{ worker.name }}</span>
                          @if (worker.account_status === 'ACTIVE') {
                            <span class="material-symbols-outlined text-[16px] text-voltage-orange" title="Mitra Terverifikasi">verified</span>
                          } @else {
                            <span class="material-symbols-outlined text-[16px] text-ink-disabled" title="Verifikasi Ditahan">schedule</span>
                          }
                        </div>
                        <span class="text-xs text-ink-secondary truncate font-sans">{{ worker.bio || 'Mitra Teknisi Mandiri' }}</span>
                        <div class="mt-1 flex items-center gap-1.5">
                          <a
                            [routerLink]="['/', worker.slug]"
                            target="_blank"
                            class="px-1.5 py-0.5 bg-surface-highlight border border-hairline-light rounded text-[11px] text-ink-on-light hover:underline inline-flex items-center gap-1"
                            [class.line-through]="worker.account_status === 'SUSPENDED'"
                            [class.text-ink-disabled]="worker.account_status === 'SUSPENDED'"
                            title="Buka profil publik"
                          >
                            <span>tuwaktu.com/{{ worker.slug }}</span>
                            <span class="material-symbols-outlined text-[12px]">north_east</span>
                          </a>
                          <button
                            type="button"
                            class="text-ink-disabled hover:text-ink-on-light p-0.5 cursor-pointer"
                            (click)="copyToClipboard('https://tuwaktu.com/' + worker.slug)"
                            title="Salin tautan profil"
                          >
                            <span class="material-symbols-outlined text-[13px]">content_copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Kontak & Basecamp Zona -->
                  <td class="py-4 px-4 md:px-6 align-top">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-1.5 text-xs text-ink-on-light">
                        <span class="font-bold">{{ worker.whatsapp_number || worker.phone_number }}</span>
                        <button
                          type="button"
                          class="text-ink-disabled hover:text-ink-on-light cursor-pointer"
                          (click)="copyToClipboard(worker.whatsapp_number || worker.phone_number)"
                          title="Salin nomor kontak"
                        >
                          <span class="material-symbols-outlined text-[13px]">content_copy</span>
                        </button>
                      </div>
                      <span class="text-[11px] text-ink-secondary">{{ worker.email }}</span>
                      <div class="flex items-center gap-1 mt-1 text-[11px] text-ink-on-light">
                        <span class="material-symbols-outlined text-[14px] text-voltage-orange">near_me</span>
                        <span>{{ worker.zone || 'Pangkalan Belum Diatur' }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Tarif Dasar & Skema -->
                  <td class="py-4 px-4 md:px-6 align-top">
                    <div class="flex flex-col">
                      <a
                        [routerLink]="['/dashboard/tarif-layanan']"
                        [queryParams]="{ slug: worker.slug }"
                        class="font-bold text-ink-on-light text-xs hover:underline tabular-nums"
                        [class.line-through]="worker.account_status === 'SUSPENDED'"
                        [class.text-ink-disabled]="worker.account_status === 'SUSPENDED'"
                        title="Kelola Tarif &amp; Layanan {{ worker.name }}"
                      >
                        Rp {{ worker.base_price.toLocaleString('id-ID') }} / {{ worker.rate_type === 'HOURLY' ? 'jam' : 'unit' }}
                      </a>
                      <span class="text-[11px] text-whatsapp-green font-medium">0% Komisi (100% Hak Mitra)</span>
                      <span class="text-[10px] text-ink-disabled mt-0.5">
                        {{ worker.rate_type === 'HOURLY' ? 'Reservasi Berbasis Waktu' : 'Paket Berbasis Unit' }}
                      </span>
                    </div>
                  </td>

                  <!-- Status Akun -->
                  <td class="py-4 px-4 md:px-6 align-top">
                    <app-admin-worker-status-badge [status]="worker.account_status" />
                  </td>

                  <!-- Aksi Kontrol Cepat -->
                  <td class="py-4 px-4 md:px-6 align-top text-right">
                    <div class="flex items-center justify-end gap-1.5 flex-wrap">
                      <a
                        [routerLink]="['/dashboard/tarif-layanan']"
                        [queryParams]="{ slug: worker.slug }"
                        class="h-8 px-2.5 bg-surface-highlight hover:bg-body-canvas border border-hairline-light rounded text-ink-on-light text-[11px] font-bold uppercase tracking-wider font-mono-rate inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kelola Tarif &amp; Layanan Mitra"
                        [attr.data-testid]="'manage-rates-btn-' + worker.slug"
                      >
                        <span class="material-symbols-outlined text-[15px]">payments</span>
                        <span class="hidden md:inline">Tarif</span>
                      </a>
                      <a
                        [routerLink]="['/dashboard/kalender-slot']"
                        [queryParams]="{ slug: worker.slug }"
                        class="h-8 px-2.5 bg-surface-highlight hover:bg-body-canvas border border-hairline-light rounded text-ink-on-light text-[11px] font-bold uppercase tracking-wider font-mono-rate inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kelola Kalender &amp; Slot Mitra"
                        [attr.data-testid]="'manage-schedule-btn-' + worker.slug"
                      >
                        <span class="material-symbols-outlined text-[15px]">calendar_month</span>
                        <span class="hidden md:inline">Slot</span>
                      </a>
                      @if (worker.account_status === 'ACTIVE') {
                        <button
                          type="button"
                          class="h-8 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded text-[11px] font-bold uppercase tracking-wider font-mono-rate transition-colors cursor-pointer inline-flex items-center gap-1"
                          (click)="toggleStatusClick.emit(worker)"
                          [attr.data-testid]="'suspend-btn-' + worker.slug"
                          title="Tangguhkan akun mitra ini"
                        >
                          <span>Tangguhkan</span>
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="h-8 px-2.5 bg-whatsapp-surface hover:bg-whatsapp-green/20 border border-whatsapp-green/40 text-whatsapp-ink rounded text-[11px] font-bold uppercase tracking-wider font-mono-rate transition-colors cursor-pointer inline-flex items-center gap-1"
                          (click)="toggleStatusClick.emit(worker)"
                          [attr.data-testid]="'activate-btn-' + worker.slug"
                          title="Aktifkan kembali akun mitra ini"
                        >
                          <span class="material-symbols-outlined text-[15px] text-whatsapp-green">check_circle</span>
                          <span>Aktifkan</span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Pagination Bar -->
        <div class="p-3.5 px-4 md:px-6 bg-surface-highlight border-t border-hairline-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono-rate">
          <span class="text-ink-secondary">
            Menampilkan <span class="font-bold text-ink-on-light">1 - {{ workers().length }}</span> dari <span class="font-bold text-ink-on-light">{{ workers().length }}</span> Total Mitra Mandiri Terdaftar
          </span>
          <span class="text-[11px] text-ink-disabled font-bold uppercase">
            DIRECT DISPATCH • AUDITED REPOSITORY
          </span>
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

  getInitials(name: string): string {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
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
