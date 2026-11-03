import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-rates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-dashboard-rates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardRatesComponent {
  readonly store = inject(WorkerDashboardStore);

  onBasePriceChange(rawValue: unknown): void {
    this.store.onBasePriceChange(rawValue);
  }

  setRateType(type: 'HOURLY' | 'UNIT'): void {
    this.store.setRateType(type);
  }

  submitRates(): void {
    this.store.submitRatesUpdate();
  }
}

