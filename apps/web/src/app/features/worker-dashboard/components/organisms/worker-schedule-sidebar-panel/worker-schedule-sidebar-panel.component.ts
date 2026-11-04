import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulePublicPreviewCardComponent } from '../../molecules/schedule-public-preview-card/schedule-public-preview-card.component';
import { ScheduleManifestoCardComponent } from '../../molecules/schedule-manifesto-card/schedule-manifesto-card.component';
import { ScheduleCalendarSyncCardComponent } from '../../molecules/schedule-calendar-sync-card/schedule-calendar-sync-card.component';

@Component({
  selector: 'app-worker-schedule-sidebar-panel',
  standalone: true,
  imports: [
    CommonModule,
    SchedulePublicPreviewCardComponent,
    ScheduleManifestoCardComponent,
    ScheduleCalendarSyncCardComponent,
  ],
  template: `
    <div class="flex flex-col gap-space-xl w-full">
      <!-- Widget 1: Status Sinkronisasi Kalender Publik Live -->
      <app-schedule-public-preview-card
        [workerName]="workerName()"
        [publicProfileUrl]="publicProfileUrl()"
        [isSlot3Locked]="isSlot3Locked()"
        (openPublicSimulation)="openPublicSimulation.emit()"
      />

      <!-- Widget 2: Manifesto Doktrin Kedaulatan Waktu & Anti-Bentrok -->
      <app-schedule-manifesto-card />

      <!-- Widget 3: Sinkronisasi Kalender Eksternal 2-Way Sync -->
      <app-schedule-calendar-sync-card
        [webcalUrl]="webcalUrl()"
        [autoBlockAgenda]="autoBlockAgenda()"
        (toggleAutoBlock)="toggleAutoBlock.emit()"
        (manageGoogleSync)="manageGoogleSync.emit()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerScheduleSidebarPanelComponent {
  readonly workerName = input<string>('Sarah Melinda');
  readonly publicProfileUrl = input<string>('tuwaktu.com/sarah-cleaning');
  readonly webcalUrl = input<string>('webcal://tuwaktu.com/feed/cal/c8f29e10');
  readonly autoBlockAgenda = input<boolean>(true);
  readonly isSlot3Locked = input<boolean>(false);

  readonly openPublicSimulation = output<void>();
  readonly toggleAutoBlock = output<void>();
  readonly manageGoogleSync = output<void>();
}
