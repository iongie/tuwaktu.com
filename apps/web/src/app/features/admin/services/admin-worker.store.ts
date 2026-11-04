import { computed, inject, Injectable, signal } from '@angular/core';
import { AdminWorkerApiService } from './admin-worker-api.service';
import {
  AdminCreateWorkerPayload,
  AdminWorkerCreatedResponse,
  AdminWorkerFilterStatus,
  AdminWorkerListItem,
} from '../models/admin-worker.model';

@Injectable({
  providedIn: 'root',
})
export class AdminWorkerStore {
  private readonly apiService = inject(AdminWorkerApiService);

  readonly workers = signal<AdminWorkerListItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<AdminWorkerFilterStatus>('ALL');

  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isOnboardingSubmitting = signal<boolean>(false);
  readonly newlyCreatedWorker = signal<AdminWorkerCreatedResponse | null>(null);

  readonly totalWorkersCount = computed<number>(() => this.workers().length);
  readonly activeWorkersCount = computed<number>(
    () => this.workers().filter((w) => w.account_status === 'ACTIVE').length
  );
  readonly suspendedWorkersCount = computed<number>(
    () => this.workers().filter((w) => w.account_status === 'SUSPENDED').length
  );

  readonly filteredWorkers = computed<AdminWorkerListItem[]>(() => {
    const list = this.workers();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();

    return list.filter((worker) => {
      // 1. Filter status akun
      if (filter !== 'ALL' && worker.account_status !== filter) {
        return false;
      }

      // 2. Filter query pencarian
      if (!query) {
        return true;
      }

      const matchName = worker.name.toLowerCase().includes(query);
      const matchSlug = worker.slug.toLowerCase().includes(query);
      const matchEmail = worker.email.toLowerCase().includes(query);
      const matchPhone = (worker.phone_number || '').includes(query);
      const matchWA = (worker.whatsapp_number || '').includes(query);
      const matchZone = (worker.zone || '').toLowerCase().includes(query);

      return (
        matchName || matchSlug || matchEmail || matchPhone || matchWA || matchZone
      );
    });
  });

  loadWorkers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.fetchWorkers().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this.workers.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message ||
          'Gagal memuat daftar mitra dari server backend. Silakan coba lagi.';
        this.errorMessage.set(msg);
      },
    });
  }

  openCreateModal(): void {
    this.newlyCreatedWorker.set(null);
    this.errorMessage.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.newlyCreatedWorker.set(null);
  }

  submitOnboarding(payload: AdminCreateWorkerPayload): void {
    this.isOnboardingSubmitting.set(true);
    this.errorMessage.set(null);

    this.apiService.createWorker(payload).subscribe({
      next: (res) => {
        this.isOnboardingSubmitting.set(false);
        if (res.success && res.data) {
          this.newlyCreatedWorker.set(res.data);
          this.feedbackMessage.set(
            `Mitra baru "${res.data.worker.name}" berhasil didaftarkan.`
          );
          // Muat ulang daftar pekerja agar tersinkronisasi
          this.loadWorkers();
        }
      },
      error: (err) => {
        this.isOnboardingSubmitting.set(false);
        const msg =
          err?.error?.message ||
          'Terjadi kesalahan saat menyimpan akun mitra baru.';
        this.errorMessage.set(msg);
      },
    });
  }

  toggleWorkerStatus(worker: AdminWorkerListItem): void {
    const newStatus =
      worker.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const targetId = worker.worker_id || worker.account_id;

    this.apiService.updateWorkerStatus(targetId, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          // Mutasi optimistik pada daftar lokal
          this.workers.update((list) =>
            list.map((item) =>
              item.account_id === worker.account_id ||
              item.worker_id === worker.worker_id
                ? { ...item, account_status: newStatus }
                : item
            )
          );

          const statusLabel =
            newStatus === 'ACTIVE' ? 'diaktifkan' : 'ditangguhkan (blokir)';
          this.feedbackMessage.set(
            `Status mitra "${worker.name}" berhasil ${statusLabel}.`
          );
        }
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          `Gagal mengubah status mitra "${worker.name}".`;
        this.errorMessage.set(msg);
      },
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(status: AdminWorkerFilterStatus): void {
    this.statusFilter.set(status);
  }

  clearFeedback(): void {
    this.feedbackMessage.set(null);
    this.errorMessage.set(null);
  }
}

