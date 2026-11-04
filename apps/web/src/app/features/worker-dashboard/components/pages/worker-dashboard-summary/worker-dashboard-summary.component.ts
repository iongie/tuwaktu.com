import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardHeroBannerComponent } from '../../organisms/worker-dashboard-hero-banner/worker-dashboard-hero-banner.component';
import { SummaryScheduleHubComponent } from '../../organisms/summary-schedule-hub/summary-schedule-hub.component';
import { SummaryLogisticsServicesHubComponent } from '../../organisms/summary-logistics-services-hub/summary-logistics-services-hub.component';
import { SummaryRecentTransactionsTableComponent } from '../../organisms/summary-recent-transactions-table/summary-recent-transactions-table.component';

@Component({
  selector: 'app-worker-dashboard-summary',
  standalone: true,
  imports: [
    CommonModule,
    WorkerDashboardHeroBannerComponent,
    SummaryScheduleHubComponent,
    SummaryLogisticsServicesHubComponent,
    SummaryRecentTransactionsTableComponent,
  ],
  templateUrl: './worker-dashboard-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardSummaryComponent {
  readonly store = inject(WorkerDashboardStore);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loadProfileByLookupInput(customSlug?: string): void {
    const slug = (customSlug || this.store.workerLookupSlugInput()).trim();
    if (!slug) return;
    this.store.loadExistingWorkerProfile(slug, () => {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { slug: slug.toLowerCase() },
        queryParamsHandling: 'merge',
      });
    });
  }
}
