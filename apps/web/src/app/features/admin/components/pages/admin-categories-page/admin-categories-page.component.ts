import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCategoryStore } from '../../../services/admin-category.store';
import { AdminCategoriesTableComponent } from '../../organisms/admin-categories-table/admin-categories-table.component';
import { AdminCategoryModalComponent } from '../../organisms/admin-category-modal/admin-category-modal.component';
import { AdminCategoryFilterBarComponent } from '../../molecules/admin-category-filter-bar/admin-category-filter-bar.component';
import { FeedbackAlertBannerComponent } from '../../../../worker-dashboard/components/molecules/feedback-alert-banner/feedback-alert-banner.component';
import {
  AdminCategory,
  CreateAdminCategoryPayload,
} from '../../../models/admin-category.model';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AdminCategoryFilterBarComponent,
    AdminCategoriesTableComponent,
    AdminCategoryModalComponent,
    FeedbackAlertBannerComponent,
  ],
  templateUrl: './admin-categories-page.component.html',
})
export class AdminCategoriesPageComponent implements OnInit {
  readonly store = inject(AdminCategoryStore);
  readonly isSyncBannerVisible = signal<boolean>(true);

  ngOnInit(): void {
    this.store.loadCategories();
  }

  dismissSyncBanner(): void {
    this.isSyncBannerVisible.set(false);
  }

  handleSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setSearchQuery(input.value);
  }

  handleFilterChange(filter: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.store.setStatusFilter(filter);
  }

  handleAddCategory(): void {
    this.store.openCreateModal();
  }

  handleEditCategory(category: AdminCategory): void {
    this.store.openEditModal(category);
  }

  handleSaveCategory(payload: CreateAdminCategoryPayload): void {
    this.store.saveCategory(payload);
  }

  handleToggleStatus(category: AdminCategory): void {
    this.store.toggleStatus(category);
  }

  handleDeleteCategory(category: AdminCategory): void {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      this.store.deleteCategory(category);
    }
  }

  exportSchema(): void {
    const list = this.store.categories();
    if (!list || list.length === 0) return;
    if (typeof document === 'undefined') return;

    const jsonContent =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(list, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute(
      'download',
      `kategori-tuwaktu-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
