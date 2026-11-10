import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminCategory } from '../../../models/admin-category.model';
import { AdminCategoryStatusBadgeComponent } from '../../molecules/admin-category-status-badge/admin-category-status-badge.component';

@Component({
  selector: 'app-admin-categories-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, AdminCategoryStatusBadgeComponent],
  template: `
    <div class="w-full overflow-hidden rounded-[10px] border border-hairline-light bg-body-canvas shadow-none mb-6">
      @if (categories().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-categories-state">
          <div class="w-12 h-12 rounded bg-surface-highlight border border-hairline-light flex items-center justify-center text-ink-secondary mb-4">
            <span class="material-symbols-outlined text-2xl">category</span>
          </div>
          <h3 class="text-base font-bold text-ink-on-light mb-1">Belum Ada Kategori Keahlian</h3>
          <p class="text-xs text-ink-secondary max-w-sm mb-6">
            Tidak ditemukan kategori dengan filter pencarian ini atau belum ada data keahlian tersimpan.
          </p>
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded bg-hero-canvas text-ink-on-dark text-xs font-bold uppercase tracking-wider font-mono-rate hover:bg-neutral-800 transition cursor-pointer"
            (click)="addCategoryClick.emit()"
            data-testid="empty-add-category-btn"
          >
            + Tambah Kategori Pertama
          </button>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-highlight text-ink-secondary text-[11px] font-mono-rate font-bold uppercase tracking-wider border-b border-hairline-light">
                <th scope="col" class="py-3.5 px-4 md:px-6">KEAHLIAN &amp; IKON</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">DESKRIPSI &amp; TAG</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">TARIF AWAL REKOMENDASI</th>
                <th scope="col" class="py-3.5 px-4 text-center">URUTAN TAMPIL</th>
                <th scope="col" class="py-3.5 px-4 text-center">STATUS KATALOG</th>
                <th scope="col" class="py-3.5 px-4 md:px-6 text-right">AKSI KONTROL</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-light text-xs font-mono-rate text-ink-on-light">
              @for (cat of categories(); track cat.id) {
                <tr
                  class="hover:bg-surface-highlight/60 transition-colors"
                  [class.opacity-70]="!cat.is_active"
                >
                  <!-- Kolom Nama & Ikon -->
                  <td class="py-4 px-4 md:px-6 align-top">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded bg-hero-canvas text-voltage-orange flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[20px]">{{ cat.icon || 'build' }}</span>
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-ink-on-light text-sm font-sans truncate">{{ cat.name }}</span>
                        <span class="font-mono-rate text-[11px] text-ink-disabled">/{{ cat.slug }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Kolom Deskripsi & Tag -->
                  <td class="py-4 px-4 md:px-6 align-top max-w-xs">
                    <p class="text-xs text-ink-secondary line-clamp-2 leading-relaxed font-sans">
                      {{ cat.description || 'Belum ada deskripsi cakupan layanan.' }}
                    </p>
                    @if (cat.highlight_tag) {
                      <div class="flex flex-wrap gap-1 mt-1.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono-rate bg-surface-highlight border border-hairline-light text-ink-on-light">
                          {{ cat.highlight_tag }}
                        </span>
                      </div>
                    }
                  </td>

                  <!-- Kolom Tarif Rekomendasi -->
                  <td class="py-4 px-4 md:px-6 align-top">
                    <div class="flex flex-col">
                      <span class="font-bold text-ink-on-light text-xs tabular-nums">
                        Rp {{ cat.starting_price | number:'1.0-0' }}
                        <span class="text-[11px] text-ink-secondary font-normal font-sans">/ {{ cat.price_unit || 'kunjungan' }}</span>
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-wider text-whatsapp-green flex items-center gap-1 mt-0.5">
                        <span class="material-symbols-outlined text-[13px]">verified</span>
                        Zero-Commission
                      </span>
                    </div>
                  </td>

                  <!-- Kolom Urutan Tampil -->
                  <td class="py-4 px-4 align-top text-center">
                    <span class="inline-flex items-center justify-center px-2 py-0.5 rounded bg-surface-highlight border border-hairline-light font-mono-rate text-xs font-bold text-ink-on-light">
                      #{{ cat.sort_order }}
                    </span>
                  </td>

                  <!-- Kolom Status Katalog -->
                  <td class="py-4 px-4 align-top text-center">
                    <app-admin-category-status-badge [isActive]="cat.is_active" />
                  </td>

                  <!-- Kolom Aksi Kontrol -->
                  <td class="py-4 px-4 md:px-6 align-top text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Toggle switch pill button -->
                      <button
                        type="button"
                        class="w-10 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer mr-1"
                        [class.bg-whatsapp-green]="cat.is_active"
                        [class.bg-hairline-light]="!cat.is_active"
                        (click)="toggleStatus.emit(cat)"
                        [title]="cat.is_active ? 'Nonaktifkan dari katalog publik' : 'Aktifkan di katalog publik'"
                        data-testid="toggle-category-status-btn"
                        role="switch"
                        [attr.aria-checked]="cat.is_active"
                      >
                        <div
                          class="w-4 h-4 bg-body-canvas rounded-full transition-transform"
                          [class.translate-x-5]="cat.is_active"
                          [class.translate-x-0]="!cat.is_active"
                        ></div>
                      </button>

                      <button
                        type="button"
                        class="w-8 h-8 flex items-center justify-center rounded border border-hairline-light text-ink-on-light hover:bg-surface-highlight transition cursor-pointer"
                        (click)="editCategory.emit(cat)"
                        title="Sunting data kategori"
                        data-testid="edit-category-btn"
                      >
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      <button
                        type="button"
                        class="w-8 h-8 flex items-center justify-center rounded border border-red-200 text-red-700 hover:bg-red-50 transition cursor-pointer"
                        (click)="deleteCategory.emit(cat)"
                        title="Hapus kategori"
                        data-testid="delete-category-btn"
                      >
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
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
            Menampilkan <span class="font-bold text-ink-on-light">1 - {{ categories().length }}</span> dari <span class="font-bold text-ink-on-light">{{ categories().length }}</span> Total Kategori Terdaftar
          </span>
          <span class="text-[11px] text-ink-disabled font-bold uppercase">
            DIRECT DISPATCH • AUDITED REPOSITORY
          </span>
        </div>
      }
    </div>
  `,
})
export class AdminCategoriesTableComponent {
  readonly categories = input<AdminCategory[]>([]);

  readonly addCategoryClick = output<void>();
  readonly editCategory = output<AdminCategory>();
  readonly toggleStatus = output<AdminCategory>();
  readonly deleteCategory = output<AdminCategory>();
}
