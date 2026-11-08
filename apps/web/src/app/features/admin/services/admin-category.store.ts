import { computed, inject, Injectable, signal } from '@angular/core';
import { AdminCategoryApiService } from './admin-category-api.service';
import {
  AdminCategory,
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
} from '../models/admin-category.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoryStore {
  private readonly apiService = inject(AdminCategoryApiService);

  readonly categories = signal<AdminCategory[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  readonly isModalOpen = signal<boolean>(false);
  readonly editingCategory = signal<AdminCategory | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  readonly totalCount = computed<number>(() => this.categories().length);
  readonly activeCount = computed<number>(
    () => this.categories().filter((c) => c.is_active).length
  );
  readonly inactiveCount = computed<number>(
    () => this.categories().filter((c) => !c.is_active).length
  );

  readonly filteredCategories = computed<AdminCategory[]>(() => {
    const list = this.categories();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();

    return list.filter((cat) => {
      if (filter === 'ACTIVE' && !cat.is_active) {
        return false;
      }
      if (filter === 'INACTIVE' && cat.is_active) {
        return false;
      }

      if (!query) {
        return true;
      }

      const matchName = (cat.name || '').toLowerCase().includes(query);
      const matchSlug = (cat.slug || '').toLowerCase().includes(query);
      const matchDesc = (cat.description || '').toLowerCase().includes(query);
      const matchTag = (cat.highlight_tag || '').toLowerCase().includes(query);

      return matchName || matchSlug || matchDesc || matchTag;
    });
  });

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.fetchCategories().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this.categories.set(res.data);
        } else {
          this.errorMessage.set(res.message || 'Gagal memuat katalog keahlian teknisi');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const serverMsg = err?.error?.message;
        this.errorMessage.set(
          serverMsg || 'Kendala jaringan atau sesi otentikasi admin telah berakhir'
        );
      },
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(filter: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(filter);
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.isModalOpen.set(true);
    this.errorMessage.set(null);
  }

  openEditModal(category: AdminCategory): void {
    this.editingCategory.set(category);
    this.isModalOpen.set(true);
    this.errorMessage.set(null);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCategory.set(null);
  }

  saveCategory(payload: CreateAdminCategoryPayload): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const currentEditing = this.editingCategory();
    if (currentEditing) {
      const updatePayload: UpdateAdminCategoryPayload = {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        icon: payload.icon,
        starting_price: payload.starting_price,
        price_unit: payload.price_unit,
        availability_tag: payload.availability_tag,
        highlight_tag: payload.highlight_tag,
        is_active: payload.is_active,
        sort_order: payload.sort_order,
      };

      this.apiService.updateCategory(currentEditing.id, updatePayload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success && res.data) {
            this.categories.update((prev) =>
              prev.map((c) => (c.id === res.data.id ? res.data : c))
            );
            this.feedbackMessage.set(res.message || 'Kategori berhasil diperbarui');
            this.closeModal();
          } else {
            this.errorMessage.set(res.message || 'Gagal memperbarui kategori');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err?.error?.message || 'Gagal memperbarui kategori. Periksa koneksi atau input Anda.'
          );
        },
      });
    } else {
      this.apiService.createCategory(payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success && res.data) {
            this.categories.update((prev) => [res.data, ...prev]);
            this.feedbackMessage.set(res.message || 'Kategori baru berhasil ditambahkan');
            this.closeModal();
          } else {
            this.errorMessage.set(res.message || 'Gagal menambahkan kategori');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err?.error?.message || 'Gagal menambahkan kategori. Periksa duplikasi slug atau input.'
          );
        },
      });
    }
  }

  toggleStatus(category: AdminCategory): void {
    const updatedStatus = !category.is_active;
    const previousCategories = this.categories();

    // Optimistic update
    this.categories.update((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_active: updatedStatus } : c))
    );

    this.apiService
      .updateCategory(category.id, { is_active: updatedStatus })
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.categories.set(previousCategories);
            this.errorMessage.set(res.message || 'Gagal mengubah status kategori');
          } else {
            this.feedbackMessage.set(
              `Status kategori '${category.name}' diubah menjadi ${
                updatedStatus ? 'Aktif' : 'Nonaktif'
              }`
            );
          }
        },
        error: (err) => {
          this.categories.set(previousCategories);
          this.errorMessage.set(
            err?.error?.message || 'Gagal mengubah status kategori di server'
          );
        },
      });
  }

  deleteCategory(category: AdminCategory): void {
    const previousCategories = this.categories();

    this.categories.update((prev) => prev.filter((c) => c.id !== category.id));

    this.apiService.deleteCategory(category.id).subscribe({
      next: (res) => {
        if (!res.success) {
          this.categories.set(previousCategories);
          this.errorMessage.set(res.message || 'Gagal menghapus kategori');
        } else {
          this.feedbackMessage.set(`Kategori '${category.name}' berhasil dihapus`);
        }
      },
      error: (err) => {
        this.categories.set(previousCategories);
        this.errorMessage.set(
          err?.error?.message || 'Gagal menghapus kategori dari server'
        );
      },
    });
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  clearFeedback(): void {
    this.feedbackMessage.set(null);
  }
}
