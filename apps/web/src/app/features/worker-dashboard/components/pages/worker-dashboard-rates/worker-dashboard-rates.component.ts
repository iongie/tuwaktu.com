import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';
import { WorkerServiceCatalogPanelComponent } from '../../organisms/worker-service-catalog-panel/worker-service-catalog-panel.component';
import { WorkerRatesGuidelinesSidebarComponent } from '../../organisms/worker-rates-guidelines-sidebar/worker-rates-guidelines-sidebar.component';
import { RatesFilterTabsComponent } from '../../molecules/rates-filter-tabs/rates-filter-tabs.component';
import { RatesSimulationModalComponent } from '../../molecules/rates-simulation-modal/rates-simulation-modal.component';
import { RatesEditServiceModalComponent } from '../../molecules/rates-edit-service-modal/rates-edit-service-modal.component';

@Component({
  selector: 'app-worker-dashboard-rates',
  standalone: true,
  imports: [
    CommonModule,
    RatesFilterTabsComponent,
    WorkerServiceCatalogPanelComponent,
    WorkerRatesGuidelinesSidebarComponent,
    RatesSimulationModalComponent,
    RatesEditServiceModalComponent,
  ],
  templateUrl: './worker-dashboard-rates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardRatesComponent {
  readonly store = inject(WorkerDashboardStore);

  readonly isSimulationModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly selectedServiceToEdit = signal<WorkerServiceCatalogItem | null>(null);

  openSimulationModal(): void {
    this.isSimulationModalOpen.set(true);
  }

  closeSimulationModal(): void {
    this.isSimulationModalOpen.set(false);
  }

  openAddNewServiceModal(): void {
    this.selectedServiceToEdit.set(null);
    this.isEditModalOpen.set(true);
  }

  openEditServiceModal(item: WorkerServiceCatalogItem): void {
    this.selectedServiceToEdit.set(item);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedServiceToEdit.set(null);
  }

  handleServiceSaved(service: WorkerServiceCatalogItem): void {
    const existing = this.selectedServiceToEdit();
    if (existing) {
      this.store.updateServiceCatalogItem(existing.id, service);
    } else {
      this.store.addNewCatalogService(service);
    }
    this.closeEditModal();
    if (this.store.hasActiveWorker()) {
      this.store.submitRatesUpdate();
    }
  }

  onBasePriceChange(rawValue: unknown): void {
    this.store.onBasePriceChange(rawValue);
  }

  setRateType(type: 'HOURLY' | 'UNIT'): void {
    this.store.setRateType(type);
  }

  submitRates(): void {
    this.store.submitRatesUpdate();
  }
}
