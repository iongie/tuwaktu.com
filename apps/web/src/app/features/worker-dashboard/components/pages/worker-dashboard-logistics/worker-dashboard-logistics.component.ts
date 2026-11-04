import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerBasecampMapPanelComponent } from '../../organisms/worker-basecamp-map-panel/worker-basecamp-map-panel.component';
import { WorkerLogisticsConfigPanelComponent } from '../../organisms/worker-logistics-config-panel/worker-logistics-config-panel.component';
import { LogisticsZoneSpectrumMeterComponent } from '../../molecules/logistics-zone-spectrum-meter/logistics-zone-spectrum-meter.component';
import { LogisticsSimulatorTerminalComponent } from '../../molecules/logistics-simulator-terminal/logistics-simulator-terminal.component';
import { LogisticsManifestoCardComponent } from '../../molecules/logistics-manifesto-card/logistics-manifesto-card.component';

@Component({
  selector: 'app-worker-dashboard-logistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WorkerBasecampMapPanelComponent,
    WorkerLogisticsConfigPanelComponent,
    LogisticsZoneSpectrumMeterComponent,
    LogisticsSimulatorTerminalComponent,
    LogisticsManifestoCardComponent,
  ],
  templateUrl: './worker-dashboard-logistics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardLogisticsComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly isSavedSuccess = signal<boolean>(false);
  private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

  onCoordinatesChanged(coords: { lat: number; lng: number }): void {
    this.store.onWorkerCoordinatesChanged(coords);
  }

  onAddressChanged(address: string): void {
    this.store.setWorkerBasecampAddress(address);
  }

  onMaxRadiusChange(val: unknown): void {
    this.store.onMaxRadiusKmChange(val);
  }

  onFreeRadiusChange(val: unknown): void {
    this.store.onFreeRadiusKmChange(val);
  }

  onExtraFeeChange(val: unknown): void {
    this.store.onExtraFeePerKmChange(val);
  }

  resetToDefault(): void {
    this.store.resetLocationToDefault();
  }

  submitLocation(): void {
    this.store.submitLocationSettingsUpdate();

    this.isSavedSuccess.set(true);
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }
    this.saveTimeoutId = setTimeout(() => {
      this.isSavedSuccess.set(false);
      this.saveTimeoutId = null;
    }, 2800);
  }
}
