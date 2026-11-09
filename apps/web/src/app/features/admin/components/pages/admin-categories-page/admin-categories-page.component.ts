import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCategoryStore } from '../../../services/admin-category.store';
import { AdminCategoriesTableComponent } from '../../organisms/admin-categories-table/admin-categories-table.component';
import { AdminCategoryModalComponent } from '../../organisms/admin-category-modal/admin-category-modal.component';
import { AdminCategoryFilterBarComponent } from '../../molecules/admin-category-filter-bar/admin-category-filter-bar.component';
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
  ],
  templateUrl: './admin-categories-page.component.html',
})
export class AdminCategoriesPageComponent implements OnInit {
  readonly store = inject(AdminCategoryStore);

  ngOnInit(): void {
    this.store.loadCategories();
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
}
