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
    <div class="w-full overflow-hidden rounded-2xl border border-hairline-subtle bg-surface shadow-xs">
      @if (categories().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-categories-state">
          <div class="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
            <span class="material-symbols-outlined text-3xl">category</span>
          </div>
          <h3 class="text-base font-bold text-on-surface mb-1">Belum Ada Kategori Keahlian</h3>
          <p class="text-sm text-on-surface-variant max-w-sm mb-6">
            Tidak ditemukan kategori dengan filter pencarian ini atau belum ada data keahlian tersimpan.
          </p>
          <button
            type="button"
            class="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition cursor-pointer"
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
              <tr class="border-b border-hairline bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <th scope="col" class="py-3.5 px-4 md:px-6">Keahlian &amp; Ikon</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Deskripsi &amp; Tag</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Tarif Awal</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Urutan</th>
                <th scope="col" class="py-3.5 px-4 md:px-6">Status Katalog</th>
                <th scope="col" class="py-3.5 px-4 md:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline text-sm">
              @for (cat of categories(); track cat.id) {
                <tr class="hover:bg-surface-container-low/60 transition group">
                  <!-- Kolom Nama & Ikon -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-xl">{{ cat.icon || 'build' }}</span>
                      </div>
                      <div>
                        <div class="font-bold text-on-surface flex items-center gap-2">
                          <span>{{ cat.name }}</span>
                        </div>
                        <div class="text-xs font-mono text-on-surface-variant mt-0.5">
                          /{{ cat.slug }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Kolom Deskripsi & Highlight -->
                  <td class="py-4 px-4 md:px-6 max-w-xs">
                    <p class="text-xs text-on-surface line-clamp-2 leading-relaxed">
                      {{ cat.description || 'Tidak ada deskripsi' }}
                    </p>
                    @if (cat.highlight_tag) {
                      <span class="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-high text-on-surface">
                        {{ cat.highlight_tag }}
                      </span>
                    }
                  </td>

                  <!-- Kolom Tarif -->
                  <td class="py-4 px-4 md:px-6">
                    <div class="font-mono font-semibold text-on-surface">
                      Rp {{ cat.starting_price | number:'1.0-0' }}
                    </div>
                    <div class="text-xs text-on-surface-variant">
                      per {{ cat.price_unit || 'kunjungan' }}
                    </div>
                  </td>

                  <!-- Kolom Urutan -->
                  <td class="py-4 px-4 md:px-6">
                    <span class="font-mono text-xs px-2 py-1 rounded bg-surface-container-high text-on-surface font-semibold">
                      #{{ cat.sort_order }}
                    </span>
                  </td>

                  <!-- Kolom Status -->
                  <td class="py-4 px-4 md:px-6">
                    <app-admin-category-status-badge [isActive]="cat.is_active" />
                  </td>

                  <!-- Kolom Aksi -->
                  <td class="py-4 px-4 md:px-6 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition cursor-pointer"
                        (click)="toggleStatus.emit(cat)"
                        [title]="cat.is_active ? 'Nonaktifkan dari katalog publik' : 'Aktifkan di katalog publik'"
                        data-testid="toggle-category-status-btn"
                      >
                        <span class="material-symbols-outlined text-lg">
                          {{ cat.is_active ? 'visibility_off' : 'visibility' }}
                        </span>
                      </button>

                      <button
                        type="button"
                        class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition cursor-pointer"
                        (click)="editCategory.emit(cat)"
                        title="Edit data kategori"
                        data-testid="edit-category-btn"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                      </button>

                      <button
                        type="button"
                        class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                        (click)="deleteCategory.emit(cat)"
                        title="Hapus kategori"
                        data-testid="delete-category-btn"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
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
