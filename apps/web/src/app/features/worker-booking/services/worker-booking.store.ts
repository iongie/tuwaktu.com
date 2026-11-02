import { computed, inject, Injectable, signal } from '@angular/core';
import { WorkerBookingApiService } from './worker-booking-api.service';
import {
  PublicServiceCatalogItem,
  PublicTechnicianProfile,
} from '../models/worker-catalog.model';
import {
  CreateServiceBookingPayload,
  ServiceBookingConfirmation,
} from '../models/service-booking.model';

@Injectable({
  providedIn: 'root',
})
export class WorkerBookingStore {
  private readonly bookingApi = inject(WorkerBookingApiService);

  readonly activeTechnicianProfile = signal<PublicTechnicianProfile | null>(null);
  readonly selectedCatalogService = signal<PublicServiceCatalogItem | null>(null);
  readonly confirmedReservation = signal<ServiceBookingConfirmation | null>(null);

  readonly isProfileLoading = signal<boolean>(false);
  readonly isReservationSubmitting = signal<boolean>(false);
  readonly profileErrorMessage = signal<string | null>(null);
  readonly reservationErrorMessage = signal<string | null>(null);

  readonly hasActiveProfile = computed(() => this.activeTechnicianProfile() !== null);
  readonly totalServiceEstimate = computed(() => this.selectedCatalogService()?.price ?? 0);

  loadTechnicianProfile(slug: string): void {
    if (!slug.trim()) {
      this.profileErrorMessage.set('Masukkan slug profil teknisi yang valid.');
      return;
    }

    this.isProfileLoading.set(true);
    this.profileErrorMessage.set(null);

    this.bookingApi.fetchPublicTechnicianProfile(slug).subscribe({
      next: (response) => {
        this.activeTechnicianProfile.set(response.data);
        this.isProfileLoading.set(false);

        const currentSelected = this.selectedCatalogService();
        if (currentSelected && !response.data.services.some((s) => s.id === currentSelected.id)) {
          this.selectedCatalogService.set(null);
        } else if (!currentSelected && response.data.services.length > 0) {
          this.selectedCatalogService.set(response.data.services[0]);
        }
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        this.isProfileLoading.set(false);
        if (err.status === 0) {
          this.profileErrorMessage.set('Gagal menghubungi server API. Pastikan backend aktif.');
        } else {
          this.profileErrorMessage.set(
            err.error?.message || 'Data profil teknisi tidak ditemukan atau terjadi gangguan layanan.'
          );
        }
      },
    });
  }

  selectCatalogService(serviceItem: PublicServiceCatalogItem): void {
    this.selectedCatalogService.set(serviceItem);
  }

  submitReservation(
    payload: CreateServiceBookingPayload,
    onSuccessCallback?: (confirmation: ServiceBookingConfirmation) => void
  ): void {
    this.isReservationSubmitting.set(true);
    this.reservationErrorMessage.set(null);

    this.bookingApi.submitServiceBookingReservation(payload).subscribe({
      next: (response) => {
        this.isReservationSubmitting.set(false);
        this.confirmedReservation.set(response.data);
        if (onSuccessCallback) {
          onSuccessCallback(response.data);
        }
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        this.isReservationSubmitting.set(false);
        if (err.status === 0) {
          this.reservationErrorMessage.set('Koneksi terputus saat memproses reservasi. Silakan periksa jaringan Anda.');
        } else {
          this.reservationErrorMessage.set(
            err.error?.message || 'Gagal memproses reservasi. Periksa kelengkapan data pemesanan.'
          );
        }
      },
    });
  }

  dismissReservationSuccess(): void {
    this.confirmedReservation.set(null);
  }
}

