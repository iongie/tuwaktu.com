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
    <div class="w-full overflow-hidden rounded-[10px] border border-hairline-light bg-body-canvas shadow-none">
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
            class="min-h-[44px] px-5 py-2.5 rounded bg-hero-canvas text-ink-on-dark text-xs font-bold uppercase tracking-wider font-mono-rate hover:bg-[#262626] transition cursor-pointer"
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
              <tr class="border-b border-hairline-light bg-surface-highlight text-xs font-bold text-ink-on-light uppercase tracking-wider font-mono-rate">
                <th scope="col" class="py-3.5 px-4 md:px-6">Keahlian &amp; Ikon</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Deskripsi &amp; Tag</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Tarif Awal</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Urutan</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Status Katalog</th>
                <th scope="col" class="py-3.5 px-4 md:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-light text-sm">
              @for (cat of categories(); track cat.id) {
                <tr class="hover:bg-surface-highlight/60 transition group">
                  <!-- Kolom Nama & Ikon -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded bg-surface-highlight border border-hairline-light text-ink-on-light flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-lg">{{ cat.icon || 'build' }}</span>
                      </div>
                      <div>
                        <div class="font-bold text-ink-on-light flex items-center gap-2">
                          <span>{{ cat.name }}</span>
                        </div>
                        <div class="text-xs font-mono-rate text-ink-secondary mt-0.5">
                          /{{ cat.slug }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Kolom Deskripsi & Highlight -->
                  <td class="py-4 px-4 md:px-6 max-w-xs">
                    <p class="text-xs text-ink-on-light line-clamp-2 leading-relaxed">
                      {{ cat.description || 'Tidak ada deskripsi' }}
                    </p>
                    @if (cat.highlight_tag) {
                      <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono-rate bg-surface-highlight border border-hairline-light text-ink-on-light">
                        {{ cat.highlight_tag }}
                      </span>
                    }
                  </td>

                  <!-- Kolom Tarif -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="font-mono-rate font-bold text-ink-on-light tabular-nums">
                      Rp {{ cat.starting_price | number:'1.0-0' }}
                    </div>
                    <div class="text-[11px] text-ink-secondary font-mono-rate">
                      per {{ cat.price_unit || 'kunjungan' }}
                    </div>
                  </td>

                  <!-- Kolom Urutan -->
                  <td class="py-4 px-4 md:px-6">
                    <span class="font-mono-rate text-xs px-2 py-1 rounded bg-surface-highlight border border-hairline-light text-ink-on-light font-bold">
                      #{{ cat.sort_order }}
                    </span>
                  </td>

                  <!-- Kolom Status -->
                  <td class="py-4 px-4 md:px-6">
                    <app-admin-category-status-badge [isActive]="cat.is_active" />
                  </td>

                  <!-- Kolom Aksi -->
                  <td class="py-4 px-4 md:px-6 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        class="min-h-[38px] min-w-[38px] flex items-center justify-center rounded border border-hairline-light text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight transition cursor-pointer"
                        (click)="toggleStatus.emit(cat)"
                        [title]="cat.is_active ? 'Nonaktifkan dari katalog publik' : 'Aktifkan di katalog publik'"
                        data-testid="toggle-category-status-btn"
                      >
                        <span class="material-symbols-outlined text-base">
                          {{ cat.is_active ? 'visibility_off' : 'visibility' }}
                        </span>
                      </button>

                      <button
                        type="button"
                        class="min-h-[38px] min-w-[38px] flex items-center justify-center rounded border border-hairline-light text-ink-on-light hover:bg-surface-highlight transition cursor-pointer"
                        (click)="editCategory.emit(cat)"
                        title="Edit data kategori"
                        data-testid="edit-category-btn"
                      >
                        <span class="material-symbols-outlined text-base">edit</span>
                      </button>

                      <button
                        type="button"
                        class="min-h-[38px] min-w-[38px] flex items-center justify-center rounded border border-red-300 text-red-700 hover:bg-red-50 transition cursor-pointer"
                        (click)="deleteCategory.emit(cat)"
                        title="Hapus kategori"
                        data-testid="delete-category-btn"
                      >
                        <span class="material-symbols-outlined text-base">delete</span>
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
})
export class AdminCategoriesTableComponent {
  readonly categories = input<AdminCategory[]>([]);

  readonly addCategoryClick = output<void>();
  readonly editCategory = output<AdminCategory>();
  readonly toggleStatus = output<AdminCategory>();
  readonly deleteCategory = output<AdminCategory>();
}
