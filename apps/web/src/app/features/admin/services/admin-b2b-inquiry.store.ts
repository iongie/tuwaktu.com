import { computed, inject, Injectable, signal } from '@angular/core';
import { AdminB2BInquiryApiService } from './admin-b2b-inquiry-api.service';
import {
  AdminB2BInquiryItem,
  AdminB2BInquirySummaryStats,
  UpdateAdminB2BInquiryPayload,
} from '../models/admin-b2b-inquiry.model';

@Injectable({
  providedIn: 'root',
})
export class AdminB2BInquiryStore {
  private readonly apiService = inject(AdminB2BInquiryApiService);

  readonly inquiries = signal<readonly AdminB2BInquiryItem[]>([]);
  readonly stats = signal<AdminB2BInquirySummaryStats>({
    total_count: 0,
    pending_follow_up_count: 0,
    active_contract_count: 0,
    paid_monthly_revenue: 0,
  });

  readonly statusFilter = signal<string>('ALL');
  readonly paymentStatusFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  readonly isLoading = signal<boolean>(false);
  readonly isUpdating = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly isModalOpen = signal<boolean>(false);
  readonly selectedInquiry = signal<AdminB2BInquiryItem | null>(null);

  readonly hasActiveFilter = computed<boolean>(
    () =>
      this.statusFilter() !== 'ALL' ||
      this.paymentStatusFilter() !== 'ALL' ||
      this.searchQuery().trim().length > 0,
  );

  loadInquiries(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .fetchInquiries({
        status: this.statusFilter(),
        payment_status: this.paymentStatusFilter(),
        q: this.searchQuery(),
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.inquiries.set(res.data.items || []);
            this.stats.set(res.data.stats);
          } else {
            this.errorMessage.set(
              res.message || 'Gagal memuat daftar pengajuan klien bisnis.',
            );
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const serverMsg = err?.error?.message;
          this.errorMessage.set(
            serverMsg ||
              'Kendala jaringan atau sesi admin telah berakhir saat memuat pengajuan B2B.',
          );
        },
      });
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.loadInquiries();
  }

  setPaymentStatusFilter(paymentStatus: string): void {
    this.paymentStatusFilter.set(paymentStatus);
    this.loadInquiries();
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  applySearch(): void {
    this.loadInquiries();
  }

  resetFilters(): void {
    this.statusFilter.set('ALL');
    this.paymentStatusFilter.set('ALL');
    this.searchQuery.set('');
    this.loadInquiries();
  }

  openManageModal(item: AdminB2BInquiryItem): void {
    this.selectedInquiry.set(item);
    this.isModalOpen.set(true);
    this.errorMessage.set(null);
  }

  closeManageModal(): void {
    this.isModalOpen.set(false);
    this.selectedInquiry.set(null);
  }

  saveInquiryUpdate(id: string, payload: UpdateAdminB2BInquiryPayload): void {
    this.isUpdating.set(true);
    this.errorMessage.set(null);

    this.apiService.updateInquiry(id, payload).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        if (res.success && res.data) {
          this.closeManageModal();
          this.feedbackMessage.set(
            `Pengajuan ${res.data.inquiry_code} berhasil diperbarui.`,
          );
          this.loadInquiries();
        } else {
          this.errorMessage.set(
            res.message || 'Gagal memperbarui status pengajuan klien bisnis.',
          );
        }
      },
      error: (err) => {
        this.isUpdating.set(false);
        const serverMsg = err?.error?.message;
        this.errorMessage.set(
          serverMsg || 'Gagal menyimpan pembaruan pengajuan klien bisnis.',
        );
      },
    });
  }

  clearFeedback(): void {
    this.feedbackMessage.set(null);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }
}

