import { computed, inject, Injectable, signal } from '@angular/core';
import { WorkerBookingApiService } from './worker-booking-api.service';
import {
  PublicServiceCatalogItem,
  PublicTechnicianProfile,
} from '../models/worker-catalog.model';
import {
  CreateServiceBookingPayload,
  FeeCalculationResult,
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

  readonly clientCoordinates = signal<{ lat: number; lng: number } | null>(null);
  readonly feeCalculation = signal<FeeCalculationResult | null>(null);
  readonly isCalculatingFee = signal<boolean>(false);
  readonly feeCalculationError = signal<string | null>(null);

  readonly isProfileLoading = signal<boolean>(false);
  readonly isReservationSubmitting = signal<boolean>(false);
  readonly profileErrorMessage = signal<string | null>(null);
  readonly reservationErrorMessage = signal<string | null>(null);

  readonly hasActiveProfile = computed(() => this.activeTechnicianProfile() !== null);
  readonly isOutOfRadius = computed(() => {
    const err = this.feeCalculationError();
    return err !== null && (err.includes('Di luar jangkauan') || err.includes('melebihi'));
  });

  readonly totalServiceEstimate = computed(() => {
    const fee = this.feeCalculation();
    if (fee && fee.is_within_radius) {
      return fee.total_price;
    }
    return this.selectedCatalogService()?.price ?? 0;
  });

  readonly transportFeeEstimate = computed(() => this.feeCalculation()?.transport_fee ?? 0);
  readonly distanceKmEstimate = computed(() => this.feeCalculation()?.distance_km ?? null);

  loadTechnicianProfile(slug: string): void {
    if (!slug.trim()) {
      this.profileErrorMessage.set('Masukkan slug profil teknisi yang valid.');
      return;
    }

    this.isProfileLoading.set(true);
    this.profileErrorMessage.set(null);
    this.feeCalculation.set(null);
    this.feeCalculationError.set(null);

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

        if (this.clientCoordinates()) {
          this.triggerFeeCalculation();
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
    if (this.clientCoordinates()) {
      this.triggerFeeCalculation();
    }
  }

  setClientCoordinates(coords: { lat: number; lng: number } | null): void {
    this.clientCoordinates.set(coords);
    if (!coords) {
      this.feeCalculation.set(null);
      this.feeCalculationError.set(null);
      return;
    }
    this.triggerFeeCalculation();
  }

  triggerFeeCalculation(): void {
    const coords = this.clientCoordinates();
    const service = this.selectedCatalogService();
    const worker = this.activeTechnicianProfile();

    if (!coords || !service || !worker) {
      return;
    }

    this.isCalculatingFee.set(true);
    this.feeCalculationError.set(null);

    this.bookingApi
      .calculateBookingFee({
        worker_id: worker.id,
        worker_slug: worker.slug,
        service_id: service.id,
        client_lat: coords.lat,
        client_lng: coords.lng,
      })
      .subscribe({
        next: (response) => {
          this.isCalculatingFee.set(false);
          this.feeCalculation.set(response.data);
          this.feeCalculationError.set(null);
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.isCalculatingFee.set(false);
          this.feeCalculation.set(null);
          const errorMsg =
            err.error?.message ||
            'Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja.';
          this.feeCalculationError.set(errorMsg);
        },
      });
  }

  submitReservation(
    payload: CreateServiceBookingPayload,
    onSuccessCallback?: (confirmation: ServiceBookingConfirmation) => void
  ): void {
    this.isReservationSubmitting.set(true);
    this.reservationErrorMessage.set(null);

    const coords = this.clientCoordinates();
    const finalPayload: CreateServiceBookingPayload = {
      ...payload,
      client_lat: coords ? coords.lat : payload.client_lat,
      client_lng: coords ? coords.lng : payload.client_lng,
    };

    this.bookingApi.submitServiceBookingReservation(finalPayload).subscribe({
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
