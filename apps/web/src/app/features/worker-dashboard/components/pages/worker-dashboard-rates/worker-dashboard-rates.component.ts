import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';
import { HomeApiService } from '../../../../home/services/home-api.service';
import { WorkerServiceCatalogPanelComponent } from '../../organisms/worker-service-catalog-panel/worker-service-catalog-panel.component';
import { WorkerRatesGuidelinesSidebarComponent } from '../../organisms/worker-rates-guidelines-sidebar/worker-rates-guidelines-sidebar.component';
import { RatesFilterTabsComponent } from '../../molecules/rates-filter-tabs/rates-filter-tabs.component';
import { RatesSimulationModalComponent } from '../../molecules/rates-simulation-modal/rates-simulation-modal.component';

@Component({
  selector: 'app-worker-dashboard-rates',
  standalone: true,
  imports: [
    CommonModule,
    RatesFilterTabsComponent,
    WorkerServiceCatalogPanelComponent,
    WorkerRatesGuidelinesSidebarComponent,
    RatesSimulationModalComponent,
  ],
  templateUrl: './worker-dashboard-rates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardRatesComponent {
  readonly store = inject(WorkerDashboardStore);
  private readonly router = inject(Router);
  private readonly homeApi = inject(HomeApiService, { optional: true });

  readonly isSimulationModalOpen = signal<boolean>(false);

  readonly categoriesList = signal<{ id: string; name: string }[]>([]);

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
    this.router.navigate(['/dashboard/tarif-layanan/tambah']);
  }

  openEditServiceModal(item: WorkerServiceCatalogItem): void {
    this.router.navigate(['/dashboard/tarif-layanan', item.id, 'edit']);
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
