import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminWorkerStore } from '../../../services/admin-worker.store';
import { AuthService } from '../../../../auth/services/auth.service';
import { AdminWorkerFilterBarComponent } from '../../molecules/admin-worker-filter-bar/admin-worker-filter-bar.component';
import { AdminWorkersTableComponent } from '../../organisms/admin-workers-table/admin-workers-table.component';
import { AdminWorkerOnboardingModalComponent } from '../../organisms/admin-worker-onboarding-modal/admin-worker-onboarding-modal.component';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';

@Component({
  selector: 'app-admin-workers-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AdminWorkerFilterBarComponent,
    AdminWorkersTableComponent,
    AdminWorkerOnboardingModalComponent,
    LogoutConfirmModalComponent,
  ],
  templateUrl: './admin-workers-page.component.html',
})
export class AdminWorkersPageComponent implements OnInit {
  readonly store = inject(AdminWorkerStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLogoutModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.store.loadWorkers();
  }

  handleLogoutConfirm(): void {
    this.isLogoutModalOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

