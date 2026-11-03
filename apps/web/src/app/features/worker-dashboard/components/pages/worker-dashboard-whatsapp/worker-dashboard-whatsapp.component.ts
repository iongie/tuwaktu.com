import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-dashboard-whatsapp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardWhatsAppProfileComponent {
  readonly store = inject(WorkerDashboardStore);

  onFullNameChange(val: string): void {
    this.store.workerFullName.set(val);
    this.store.clearInputValidationError('name');
  }

  onWhatsAppChange(val: string): void {
    this.store.workerWhatsAppNumber.set(val);
    this.store.clearInputValidationError('whatsapp_number');
  }

  onProfessionZoneChange(val: string): void {
    this.store.workerProfessionZone.set(val);
  }

  onBioChange(val: string): void {
    this.store.workerBioDescription.set(val);
  }

  onAvatarUrlChange(val: string): void {
    this.store.workerAvatarUrl.set(val);
  }

  submitProfile(): void {
    this.store.submitProfileUpdate();
  }
}

