import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulePublicPreviewCardComponent } from '../../molecules/schedule-public-preview-card/schedule-public-preview-card.component';

@Component({
  selector: 'app-worker-schedule-sidebar-panel',
  standalone: true,
  imports: [
    CommonModule,
    SchedulePublicPreviewCardComponent,
  ],
  template: `
    <div class="flex flex-col gap-space-xl w-full">
      <!-- Widget: Status Tautan Kalender & Pratinjau Publik Live -->
      <app-schedule-public-preview-card
        [workerName]="workerName()"
        [publicProfileUrl]="publicProfileUrl()"
        [isSlot3Locked]="isSlot3Locked()"
        (openPublicSimulation)="openPublicSimulation.emit()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerScheduleSidebarPanelComponent {
  readonly workerName = input<string>('Mitra Teknisi');
  readonly publicProfileUrl = input<string>('tuwaktu.com/profil');
  readonly isSlot3Locked = input<boolean>(false);

  readonly openPublicSimulation = output<void>();
}
