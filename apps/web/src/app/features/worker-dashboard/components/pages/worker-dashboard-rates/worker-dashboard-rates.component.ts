import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';
import { HomeApiService } from '../../../../home/services/home-api.service';
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
  private readonly homeApi = inject(HomeApiService, { optional: true });

  readonly isSimulationModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly selectedServiceToEdit = signal<WorkerServiceCatalogItem | null>(null);

  readonly categoriesList = signal<{ id: string; name: string }[]>([
    { id: '11111111-1111-4111-8111-111111111111', name: 'Servis & Pasang AC' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Sanitasi & Deep Clean' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Instalasi Listrik Presisi' },
    { id: '44444444-4444-4444-8444-444444444444', name: 'Reparasi Elektronik' },
  ]);

  constructor() {
    this.homeApi?.fetchPublicCategories().subscribe((cats) => {
      if (cats && cats.length > 0) {
        this.categoriesList.set(cats.map((c) => ({ id: c.id, name: c.title })));
      }
    });
  }

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
  }

  handleServiceDeleted(serviceId: string): void {
    this.store.deleteServiceCatalogItem(serviceId);
    this.closeEditModal();
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
