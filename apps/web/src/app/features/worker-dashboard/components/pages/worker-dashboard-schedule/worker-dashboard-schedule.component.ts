import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerScheduleMainPanelComponent } from '../../organisms/worker-schedule-main-panel/worker-schedule-main-panel.component';
import { WorkerScheduleSidebarPanelComponent } from '../../organisms/worker-schedule-sidebar-panel/worker-schedule-sidebar-panel.component';
import { ScheduleSimulationModalComponent } from '../../molecules/schedule-simulation-modal/schedule-simulation-modal.component';
import { ScheduleOrderDetailsModalComponent } from '../../molecules/schedule-order-details-modal/schedule-order-details-modal.component';
import { ScheduleAddSlotModalComponent } from '../../molecules/schedule-add-slot-modal/schedule-add-slot-modal.component';

@Component({
  selector: 'app-worker-dashboard-schedule',
  standalone: true,
  imports: [
    CommonModule,
    WorkerScheduleMainPanelComponent,
    WorkerScheduleSidebarPanelComponent,
    ScheduleSimulationModalComponent,
    ScheduleOrderDetailsModalComponent,
    ScheduleAddSlotModalComponent,
  ],
  templateUrl: './worker-dashboard-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardScheduleComponent implements OnDestroy {
  readonly store = inject(WorkerDashboardStore);

  readonly isSimulationModalOpen = signal<boolean>(false);
  readonly isAddSlotModalOpen = signal<boolean>(false);
  readonly selectedOrderIdForModal = signal<string | null>(null);
  readonly isSaveScheduleSuccess = signal<boolean>(false);

  private saveScheduleTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly publicProfileDisplayUrl = computed(() => {
    const slug = this.store.workerSlugIdentifier().trim();
    return slug ? `tuwaktu.com/${slug}` : 'tuwaktu.com/profil';
  });

  toggleDay(dayOfWeek: number): void {
    this.store.toggleScheduleDayActive(dayOfWeek);
  }

  toggleSlot(
    dayOfWeek: number,
    slotKey: 'slot_morning' | 'slot_afternoon' | 'slot_evening'
  ): void {
    this.store.toggleScheduleSlot(dayOfWeek, slotKey);
  }

  toggleEmergencyLock(): void {
    this.store.toggleTodayEmergencyLock();
    if (this.store.isTodayEmergencyLocked()) {
      this.store.scheduleFeedbackSuccess.set(
        'Semua slot untuk hari ini telah ditutup sementara dari pemesanan publik.'
      );
    } else {
      this.store.scheduleFeedbackSuccess.set(
        'Slot hari ini dibuka kembali sesuai jadwal mingguan reguler.'
      );
    }
  }

  openSimulationModal(): void {
    this.isSimulationModalOpen.set(true);
  }

  openAddSlotModal(): void {
    this.isAddSlotModalOpen.set(true);
  }

  openOrderDetailsModal(orderId: string): void {
    this.selectedOrderIdForModal.set(orderId);
  }

  handleEditSlotTime(): void {
    this.openAddSlotModal();
  }

  handleSlotSaved(slot: { date: string; start: string; end: string }): void {
    this.store.scheduleFeedbackSuccess.set(
      `Slot tambahan untuk ${slot.date} (${slot.start} - ${slot.end} WIB) berhasil dibuka!`
    );
  }

  handleManageGoogleSync(): void {
    this.store.scheduleFeedbackSuccess.set(
      'Pengaturan sinkronisasi Google Calendar aktif dan berjalan normal.'
    );
  }

  submitSchedule(): void {
    this.store.submitScheduleUpdate();

    this.isSaveScheduleSuccess.set(true);
    if (this.saveScheduleTimeoutId) {
      clearTimeout(this.saveScheduleTimeoutId);
    }
    this.saveScheduleTimeoutId = setTimeout(() => {
      this.isSaveScheduleSuccess.set(false);
      this.saveScheduleTimeoutId = null;
    }, 2200);

    const timerObj = this.saveScheduleTimeoutId as unknown;
    if (
      timerObj &&
      typeof timerObj === 'object' &&
      'unref' in timerObj &&
      typeof (timerObj as { unref: () => void }).unref === 'function'
    ) {
      (timerObj as { unref: () => void }).unref();
    }
  }

  ngOnDestroy(): void {
    if (this.saveScheduleTimeoutId) {
      clearTimeout(this.saveScheduleTimeoutId);
      this.saveScheduleTimeoutId = null;
    }
  }
}
