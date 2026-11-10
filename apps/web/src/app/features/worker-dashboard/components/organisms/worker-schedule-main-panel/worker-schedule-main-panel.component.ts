import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerScheduleItem } from '../../../models/worker-profile.model';
import { ScheduleBufferSelectorComponent } from '../../molecules/schedule-buffer-selector/schedule-buffer-selector.component';
import { ScheduleSlotTimelineCardComponent } from '../../molecules/schedule-slot-timeline-card/schedule-slot-timeline-card.component';
import { ScheduleWeeklyMatrixTableComponent } from '../../molecules/schedule-weekly-matrix-table/schedule-weekly-matrix-table.component';

@Component({
  selector: 'app-worker-schedule-main-panel',
  standalone: true,
  imports: [
    CommonModule,
    ScheduleBufferSelectorComponent,
    ScheduleSlotTimelineCardComponent,
    ScheduleWeeklyMatrixTableComponent,
  ],
  template: `
    <div class="flex flex-col gap-space-xl w-full">
      <!-- Section 1: Transit & Rest Buffer Discipline -->
      <app-schedule-buffer-selector
        [selectedBufferMinutes]="selectedBufferMinutes()"
        [autoPeakHourBuffer]="autoPeakHourBuffer()"
        [mandatoryLunchBreak]="mandatoryLunchBreak()"
        (bufferMinutesChange)="bufferMinutesChange.emit($event)"
        (togglePeakHour)="togglePeakHour.emit()"
        (toggleLunchBreak)="toggleLunchBreak.emit()"
      />

      <!-- Section 2: Real-Time Slots Timeline & Kalender Bulanan -->
      <app-schedule-slot-timeline-card
        [isSlot1Locked]="isSlot1Locked()"
        [isSlot2Locked]="isSlot2Locked()"
        [isSlot3Locked]="isSlot3Locked()"
        [specialHolidays]="specialHolidays()"
        [schedules]="schedules()"
        [publicProfileUrl]="publicProfileUrl()"
        [bufferMinutes]="selectedBufferMinutes()"
        [isTodayEmergencyLocked]="isTodayEmergencyLocked()"
        (toggleHoliday)="toggleHoliday.emit($event)"
        (dateChange)="dateChange.emit($event)"
        (viewOrderDetails)="viewOrderDetails.emit($event)"
        (editSlotTime)="editSlotTime.emit($event)"
        (toggleSlotLock)="toggleSlotLock.emit($event)"
        (addCustomSlot)="addCustomSlot.emit()"
      />

      <!-- Section 3: Weekly Operational Matrix -->
      <app-schedule-weekly-matrix-table
        [schedules]="schedules()"
        [leadTimeHours]="leadTimeHours()"
        (toggleDay)="toggleDay.emit($event)"
        (leadTimeChange)="leadTimeChange.emit($event)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerScheduleMainPanelComponent {
  readonly selectedBufferMinutes = input<number>(90);
  readonly autoPeakHourBuffer = input<boolean>(true);
  readonly mandatoryLunchBreak = input<boolean>(true);
  readonly selectedSegment = input<string>('Besok');
  readonly isSlot1Locked = input<boolean>(false);
  readonly isSlot2Locked = input<boolean>(false);
  readonly isSlot3Locked = input<boolean>(false);
  readonly specialHolidays = input<string[]>([]);
  readonly isTodayEmergencyLocked = input<boolean>(false);
  readonly publicProfileUrl = input<string>('tuwaktu.com/profil');
  readonly schedules = input<WorkerScheduleItem[]>([]);
  readonly leadTimeHours = input<number>(3);

  readonly bufferMinutesChange = output<number>();
  readonly togglePeakHour = output<void>();
  readonly toggleLunchBreak = output<void>();
  readonly segmentChange = output<string>();
  readonly toggleHoliday = output<string>();
  readonly dateChange = output<string>();
  readonly viewOrderDetails = output<string>();
  readonly editSlotTime = output<string>();
  readonly toggleSlotLock = output<string>();
  readonly addCustomSlot = output<void>();
  readonly toggleDay = output<number>();
  readonly leadTimeChange = output<number>();
}
