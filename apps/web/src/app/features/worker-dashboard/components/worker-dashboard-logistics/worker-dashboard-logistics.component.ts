import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../services/worker-dashboard.store';
import { LocationMapPickerComponent } from '../../../worker-booking/components/molecules/location-map-picker/location-map-picker.component';

@Component({
  selector: 'app-worker-dashboard-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationMapPickerComponent],
  templateUrl: './worker-dashboard-logistics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardLogisticsComponent {
  readonly store = inject(WorkerDashboardStore);

  onCoordinatesChanged(coords: { lat: number; lng: number }): void {
    this.store.onWorkerCoordinatesChanged(coords);
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

  submitLocation(): void {
    this.store.submitLocationSettingsUpdate();
  }
}

