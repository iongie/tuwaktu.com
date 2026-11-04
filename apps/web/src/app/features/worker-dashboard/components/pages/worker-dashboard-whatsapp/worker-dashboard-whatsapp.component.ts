import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerWhatsAppConfigPanelComponent } from '../../organisms/worker-whatsapp-config-panel/worker-whatsapp-config-panel.component';
import { WorkerWhatsAppTemplatePanelComponent } from '../../organisms/worker-whatsapp-template-panel/worker-whatsapp-template-panel.component';
import { WorkerWhatsAppPreviewMockupComponent } from '../../organisms/worker-whatsapp-preview-mockup/worker-whatsapp-preview-mockup.component';
import { WhatsAppBillingGuideComponent } from '../../molecules/whatsapp-billing-guide/whatsapp-billing-guide.component';

@Component({
  selector: 'app-worker-dashboard-whatsapp',
  standalone: true,
  imports: [
    CommonModule,
    WorkerWhatsAppConfigPanelComponent,
    WorkerWhatsAppTemplatePanelComponent,
    WorkerWhatsAppPreviewMockupComponent,
    WhatsAppBillingGuideComponent,
  ],
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

  resetDefault(): void {
    this.store.resetWhatsAppTemplateToDefault();
  }

  testSendWhatsApp(): void {
    this.store.openWhatsAppDeepLink();
  }
}
