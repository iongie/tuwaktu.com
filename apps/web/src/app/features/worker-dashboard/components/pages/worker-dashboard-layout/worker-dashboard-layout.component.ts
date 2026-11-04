import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardSidebarComponent } from '../../organisms/worker-dashboard-sidebar/worker-dashboard-sidebar.component';
import { WorkerDashboardHeaderComponent } from '../../organisms/worker-dashboard-header/worker-dashboard-header.component';
import { WorkerDashboardFooterBarComponent } from '../../organisms/worker-dashboard-footer-bar/worker-dashboard-footer-bar.component';
import { FeedbackAlertBannerComponent } from '../../molecules/feedback-alert-banner/feedback-alert-banner.component';

export interface DashboardNavMenuItem {
  readonly routePath: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
}

@Component({
  selector: 'app-worker-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    WorkerDashboardSidebarComponent,
    WorkerDashboardHeaderComponent,
    WorkerDashboardFooterBarComponent,
    FeedbackAlertBannerComponent,
  ],
  templateUrl: './worker-dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardLayoutComponent implements OnInit {
  readonly store = inject(WorkerDashboardStore);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly navMenuItems: readonly DashboardNavMenuItem[] = [
    { routePath: '/dashboard/ringkasan', label: 'Ringkasan', shortLabel: 'Ringkasan', icon: 'space_dashboard' },
    { routePath: '/dashboard/tarif-layanan', label: 'Tarif & Layanan', shortLabel: 'Tarif', icon: 'payments' },
    { routePath: '/dashboard/logistik-radius', label: 'Logistik Basecamp & Radius', shortLabel: 'Logistik', icon: 'near_me' },
    { routePath: '/dashboard/kalender-slot', label: 'Kalender & Slot', shortLabel: 'Kalender', icon: 'calendar_month' },
    { routePath: '/dashboard/integrasi-whatsapp', label: 'Integrasi WhatsApp & Profil', shortLabel: 'WhatsApp & Profil', icon: 'chat' },
    { routePath: '/dashboard/plan', label: 'Paket & Langganan', shortLabel: 'Plan Pro', icon: 'workspace_premium' },
    { routePath: '/dashboard/boost', label: 'Boost Visibilitas', shortLabel: 'Boost Radar', icon: 'bolt' },
  ];

  ngOnInit(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const querySlug = params.get('slug');
        if (querySlug && querySlug.trim()) {
          this.store.loadExistingWorkerProfile(querySlug.trim());
        }
      });
  }

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

  resetWorkerSelection(): void {
    this.store.resetWorkerSelection();
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { slug: null },
      queryParamsHandling: 'merge',
    });
  }
}
