import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardHeroBannerComponent } from '../../organisms/worker-dashboard-hero-banner/worker-dashboard-hero-banner.component';

@Component({
  selector: 'app-worker-dashboard-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    WorkerDashboardHeroBannerComponent,
  ],
  templateUrl: './worker-dashboard-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardSummaryComponent {
  readonly store = inject(WorkerDashboardStore);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loadProfileByLookupInput(): void {
    const slug = this.store.workerLookupSlugInput().trim();
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

