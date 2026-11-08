import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminCategoryStore } from '../../../services/admin-category.store';
import { AuthService } from '../../../../auth/services/auth.service';
import { AdminCategoriesTableComponent } from '../../organisms/admin-categories-table/admin-categories-table.component';
import { AdminCategoryModalComponent } from '../../organisms/admin-category-modal/admin-category-modal.component';
import { AdminCategoryFilterBarComponent } from '../../molecules/admin-category-filter-bar/admin-category-filter-bar.component';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';
import { BookingNavAccountMenuComponent } from '../../../../worker-booking/components/molecules/booking-nav-account-menu/booking-nav-account-menu.component';
import {
  AdminCategory,
  CreateAdminCategoryPayload,
} from '../../../models/admin-category.model';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    AdminCategoryFilterBarComponent,
    AdminCategoriesTableComponent,
    AdminCategoryModalComponent,
    LogoutConfirmModalComponent,
    BookingNavAccountMenuComponent,
  ],
  templateUrl: './admin-categories-page.component.html',
})
export class AdminCategoriesPageComponent implements OnInit {
  readonly store = inject(AdminCategoryStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLogoutModalOpen = signal<boolean>(false);

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

  handleLogoutConfirm(): void {
    this.isLogoutModalOpen.set(false);
    this.router.navigate(['/login']);
    this.authService.logout()?.subscribe?.();
  }
}
