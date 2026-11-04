import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryBasecampRadarCardComponent } from '../../molecules/summary-basecamp-radar-card/summary-basecamp-radar-card.component';
import { SummaryServicesDispatchCardComponent } from '../../molecules/summary-services-dispatch-card/summary-services-dispatch-card.component';

@Component({
  selector: 'app-summary-logistics-services-hub',
  standalone: true,
  imports: [
    CommonModule,
    SummaryBasecampRadarCardComponent,
    SummaryServicesDispatchCardComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Card 1: Logistik Basecamp & Mini Radar Visual -->
      <app-summary-basecamp-radar-card />

      <!-- Card 2: Layanan & Integrasi WhatsApp Dispatch -->
      <app-summary-services-dispatch-card />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryLogisticsServicesHubComponent {}
