import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-dashboard-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardScheduleComponent {
  readonly store = inject(WorkerDashboardStore);

  toggleDay(dayOfWeek: number): void {
    this.store.toggleScheduleDayActive(dayOfWeek);
  }

  toggleSlot(
    dayOfWeek: number,
    slotKey: 'slot_morning' | 'slot_afternoon' | 'slot_evening'
  ): void {
    this.store.toggleScheduleSlot(dayOfWeek, slotKey);
  }

  submitSchedule(): void {
    this.store.submitScheduleUpdate();
  }
}

