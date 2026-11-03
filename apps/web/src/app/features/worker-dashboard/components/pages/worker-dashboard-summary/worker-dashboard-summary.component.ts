import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './worker-dashboard-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardSummaryComponent {
  readonly store = inject(WorkerDashboardStore);
}

