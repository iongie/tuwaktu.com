import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { AdminWorkerStore } from '../../../services/admin-worker.store';
import { AdminWorkerFilterBarComponent } from '../../molecules/admin-worker-filter-bar/admin-worker-filter-bar.component';
import { AdminWorkersTableComponent } from '../../organisms/admin-workers-table/admin-workers-table.component';
import { AdminWorkerOnboardingModalComponent } from '../../organisms/admin-worker-onboarding-modal/admin-worker-onboarding-modal.component';

@Component({
  selector: 'app-admin-workers-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminWorkerFilterBarComponent,
    AdminWorkersTableComponent,
    AdminWorkerOnboardingModalComponent,
  ],
  templateUrl: './admin-workers-page.component.html',
})
export class AdminWorkersPageComponent implements OnInit {
  readonly store = inject(AdminWorkerStore);

  ngOnInit(): void {
    this.store.loadWorkers();
  }
}

