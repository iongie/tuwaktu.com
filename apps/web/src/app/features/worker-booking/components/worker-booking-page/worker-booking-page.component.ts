import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkerBookingStore } from '../../services/worker-booking.store';
import {
  PublicServiceCatalogItem,
  PublicTechnicianProfile,
} from '../../models/worker-catalog.model';
import {
  AvailableTimeSlot,
  CreateServiceBookingPayload,
} from '../../models/service-booking.model';
import { APP_ENVIRONMENT } from '../../../../../environments/environment.model';
import { BookingNavAccountMenuComponent } from '../molecules/booking-nav-account-menu/booking-nav-account-menu.component';
import { TechnicianSearchBarComponent } from '../molecules/technician-search-bar/technician-search-bar.component';
import { TechnicianProfileHeaderComponent } from '../organisms/technician-profile-header/technician-profile-header.component';
import {
  BookingFormDraft,
  ServiceBookingFormComponent,
} from '../organisms/service-booking-form/service-booking-form.component';
import { BookingSuccessModalComponent } from '../organisms/booking-success-modal/booking-success-modal.component';
import { WorkerPublicReviewsSectionComponent } from '../organisms/worker-public-reviews-section/worker-public-reviews-section.component';
import { buildWhatsAppBookingUrl } from '../../utils/whatsapp-message.util';

@Component({
  selector: 'app-worker-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TechnicianSearchBarComponent,
    TechnicianProfileHeaderComponent,
    ServiceBookingFormComponent,
    WorkerPublicReviewsSectionComponent,
    BookingSuccessModalComponent,
    BookingNavAccountMenuComponent,
  ],
  templateUrl: './worker-booking-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerBookingPageComponent implements OnInit {
  readonly store = inject(WorkerBookingStore);
  readonly appEnvironment = inject(APP_ENVIRONMENT);
  private readonly documentTitle = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchTechnicianSlug = signal<string>('budi-santoso');
  readonly clientValidationErrors = signal<Record<string, string>>({});
  readonly whatsappRedirectUrl = signal<string>('');
  readonly isSuccessModalOpen = signal<boolean>(false);

  clientFullName = '';
  clientContactPhone = '';
  clientEmailAddress = '';
  serviceLocationAddress = '';
  serviceOperationalZone = '';
  reservationScheduledDate = '';
  additionalClientNotes = '';

  constructor() {
    effect(() => {
      const activeWorker = this.store.activeTechnicianProfile();
      this.updateSeoOpenGraphTags(activeWorker);
      if (activeWorker && !this.serviceOperationalZone) {
        this.serviceOperationalZone = activeWorker.zone;
      }
    });
  }

  get currentFormDraft(): BookingFormDraft {
    return {
      clientFullName: this.clientFullName,
      clientContactPhone: this.clientContactPhone,
      clientEmailAddress: this.clientEmailAddress,
      serviceLocationAddress: this.serviceLocationAddress,
      serviceOperationalZone: this.serviceOperationalZone,
      reservationScheduledDate: this.reservationScheduledDate,
      additionalClientNotes: this.additionalClientNotes,
    };
  }

  applyFormDraft(draft: BookingFormDraft): void {
    this.clientFullName = draft.clientFullName;
    this.clientContactPhone = draft.clientContactPhone;
    this.clientEmailAddress = draft.clientEmailAddress;
    this.serviceLocationAddress = draft.serviceLocationAddress;
    this.serviceOperationalZone = draft.serviceOperationalZone;
    this.reservationScheduledDate = draft.reservationScheduledDate;
    this.additionalClientNotes = draft.additionalClientNotes;
  }

  ngOnInit(): void {
    this.initializeDefaultReservationSchedule();

    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const routeSlug = params.get('slug');
        if (routeSlug && routeSlug.trim()) {
          this.searchTechnicianSlug.set(routeSlug.trim());
        }
        this.executeTechnicianLookup();
      });
  }

  executeTechnicianLookup(): void {
    const slug = this.searchTechnicianSlug().trim();
    if (!slug) return;

    this.store.loadTechnicianProfile(slug);
  }

  quickSelectTechnician(slug: string): void {
    this.searchTechnicianSlug.set(slug);
    this.executeTechnicianLookup();
    this.router.navigate(['/', slug]);
  }

  onServiceItemSelected(serviceItem: PublicServiceCatalogItem): void {
    this.store.selectCatalogService(serviceItem);
    this.clearClientValidationError('service');
  }

  validateBookingForm(): boolean {
    const errors: Record<string, string> = {};

    if (!this.store.selectedCatalogService()) {
      errors['service'] = 'Silakan pilih salah satu layanan teknisi terlebih dahulu.';
    }

    if (this.store.isOutOfRadius()) {
      errors['service'] = 'Lokasi pemesanan berada di luar batas jangkauan layanan teknisi.';
    }

    const trimmedLocation = this.serviceLocationAddress.trim();
    if (!trimmedLocation) {
      errors['location'] = 'Alamat detail & patokan rumah wajib diisi.';
    } else if (trimmedLocation.length < 10) {
      errors['location'] = 'Alamat detail minimal 10 karakter untuk patokan rumah.';
    }

    if (!this.reservationScheduledDate) {
      errors['booking_date'] = 'Silakan tentukan jadwal tanggal reservasi.';
    } else {
      const parsedDate = new Date(this.reservationScheduledDate);
      if (isNaN(parsedDate.getTime())) {
        errors['booking_date'] = 'Format jadwal reservasi tidak valid.';
      } else if (parsedDate.getTime() < Date.now() - 15 * 60 * 1000) {
        errors['booking_date'] = 'Waktu kedatangan harus di masa depan.';
      }
    }

    if (!this.store.selectedTimeSlot()) {
      errors['booking_time_slot'] = 'Silakan pilih slot waktu operasional yang tersedia.';
    }

    const trimmedName = this.clientFullName.trim();
    if (!trimmedName) {
      errors['client_name'] = 'Nama lengkap pemesan wajib diisi.';
    } else if (trimmedName.length < 3) {
      errors['client_name'] = 'Nama lengkap pemesan minimal 3 karakter.';
    } else if (trimmedName.length > 100) {
      errors['client_name'] = 'Nama lengkap pemesan maksimal 100 karakter.';
    }

    const trimmedPhone = this.clientContactPhone.trim();
    if (!trimmedPhone) {
      errors['client_phone'] = 'Nomor WhatsApp aktif pemesan wajib diisi.';
    } else {
      const cleanPhone = trimmedPhone.replace(/[\s-]/g, '');
      const indonesianPhoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
      if (!indonesianPhoneRegex.test(cleanPhone)) {
        errors['client_phone'] =
          'Nomor WhatsApp tidak valid (wajib nomor ponsel Indonesia 10-15 digit diawali 08 atau 628).';
      }
    }

    const trimmedEmail = this.clientEmailAddress.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors['client_email'] = 'Format alamat email tidak valid (contoh: pemesan@email.com).';
      }
    }

    this.clientValidationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  clearClientValidationError(field: string): void {
    const current = { ...this.clientValidationErrors() };
    const fieldMap: Record<string, string> = {
      clientFullName: 'client_name',
      clientContactPhone: 'client_phone',
      clientEmailAddress: 'client_email',
      serviceLocationAddress: 'location',
      reservationScheduledDate: 'booking_date',
    };
    const targetKey = fieldMap[field] || field;
    if (current[targetKey]) {
      delete current[targetKey];
      this.clientValidationErrors.set(current);
    }
  }

  submitBookingOrder(): void {
    if (!this.validateBookingForm()) {
      this.scrollToFirstValidationError();
      return;
    }

    const selectedService = this.store.selectedCatalogService();
    const activeProfile = this.store.activeTechnicianProfile();

    if (!selectedService || !activeProfile) {
      return;
    }

    let parsedIsoDate = '';
    if (this.reservationScheduledDate) {
      const parsed = new Date(this.reservationScheduledDate);
      if (!isNaN(parsed.getTime())) {
        parsedIsoDate = parsed.toISOString();
      }
    }

    const payload: CreateServiceBookingPayload = {
      worker_id: activeProfile.id,
      worker_slug: activeProfile.slug,
      service_id: selectedService.id,
      client_name: this.clientFullName.trim(),
      client_phone: this.clientContactPhone.trim(),
      client_email: this.clientEmailAddress.trim(),
      location: this.serviceLocationAddress.trim(),
      zone: this.serviceOperationalZone.trim(),
      booking_date: parsedIsoDate,
      notes: this.additionalClientNotes.trim(),
      status: 'PENDING_WA',
    };

    this.store.submitReservation(payload, (confirmation) => {
      const workerPhone =
        confirmation.worker_whatsapp || activeProfile.whatsapp_number || '';
      const waUrl = buildWhatsAppBookingUrl(workerPhone, {
        bookingCode: confirmation.booking_code,
        workerName: confirmation.worker_name || activeProfile.name,
        serviceName: confirmation.service_name || selectedService.name,
        clientName: confirmation.client_name,
        bookingDate: confirmation.booking_date,
        location: confirmation.location,
        totalPrice: confirmation.total_price,
        notes: confirmation.notes,
      });

      this.whatsappRedirectUrl.set(waUrl);
      this.isSuccessModalOpen.set(true);
    });
  }

  handleProceedToWhatsApp(): void {
    const waUrl = this.whatsappRedirectUrl();
    if (waUrl && typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(waUrl, '_blank');
    }
    this.isSuccessModalOpen.set(false);
    this.store.dismissReservationSuccess();
    this.resetBookingForm();
  }

  handleCloseSuccessModal(): void {
    this.isSuccessModalOpen.set(false);
    this.store.dismissReservationSuccess();
    this.resetBookingForm();
  }

  private scrollToFirstValidationError(): void {
    if (typeof document === 'undefined') return;
    const errors = this.clientValidationErrors();
    let targetId = '';
    if (errors['service']) {
      targetId = 'summaryServiceTitle';
    } else if (errors['booking_date'] || errors['booking_time_slot']) {
      targetId = 'reservationDateInput';
    } else if (errors['client_name']) {
      targetId = 'clientFullNameInput';
    } else if (errors['client_phone']) {
      targetId = 'clientContactPhoneInput';
    } else if (errors['client_email']) {
      targetId = 'clientEmailAddressInput';
    } else if (errors['location']) {
      targetId = 'serviceLocationAddressInput';
    }

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.focus();
        }
      }
    }
  }

  dismissConfirmedReservation(): void {
    this.store.dismissReservationSuccess();
    this.whatsappRedirectUrl.set('');
  }

  resetBookingForm(): void {
    this.clientFullName = '';
    this.clientContactPhone = '';
    this.clientEmailAddress = '';
    this.serviceLocationAddress = '';
    this.additionalClientNotes = '';
    this.clientValidationErrors.set({});
    this.initializeDefaultReservationSchedule();
  }

  formatCurrencyRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  updateSeoOpenGraphTags(profile: PublicTechnicianProfile | null): void {
    if (!profile) {
      this.documentTitle.setTitle(this.appEnvironment.appTitle);
      this.metaService.updateTag({
        name: 'description',
        content:
          'Platform reservasi teknisi terverifikasi di Indonesia. Kunci jadwal pasti tanpa repot.',
      });
      return;
    }

    const pageTitle = `Pesan Layanan dari ${profile.name} - Tuwaktu`;
    const pageDescription = profile.bio
      ? `${profile.bio}. Wilayah operasional: ${profile.zone}. Rating ${profile.rating} (${profile.review_count} ulasan). Pesan jadwal layanan teknisi sekarang.`
      : `Pesan layanan profesional terpercaya dari ${profile.name} di zona ${profile.zone} secara online melalui Tuwaktu.`;

    this.documentTitle.setTitle(pageTitle);

    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:type', content: 'profile' });
    this.metaService.updateTag({ property: 'og:image', content: profile.avatar_url });
    this.metaService.updateTag({
      property: 'og:image:alt',
      content: `Foto profil ${profile.name}`,
    });
    this.metaService.updateTag({ property: 'og:url', content: `/${profile.slug}` });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Tuwaktu' });

    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: pageTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: pageDescription });
    this.metaService.updateTag({ name: 'twitter:image', content: profile.avatar_url });
    this.metaService.updateTag({
      name: 'twitter:image:alt',
      content: `Foto profil ${profile.name}`,
    });
  }

  onBookingDateChanged(newDate: string): void {
    if (!newDate) return;
    this.store.loadAvailableSlots(newDate);
  }

  onSlotSelected(slot: AvailableTimeSlot): void {
    this.store.selectTimeSlot(slot);
    const date = this.store.selectedBookingDate();
    if (date) {
      this.reservationScheduledDate = `${date}T${slot.start_time}:00`;
      this.clearClientValidationError('booking_date');
    }
  }

  private initializeDefaultReservationSchedule(): void {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    const year = nextDay.getFullYear();
    const month = String(nextDay.getMonth() + 1).padStart(2, '0');
    const day = String(nextDay.getDate()).padStart(2, '0');

    const defaultDate = `${year}-${month}-${day}`;
    this.store.selectedBookingDate.set(defaultDate);
    this.reservationScheduledDate = `${defaultDate}T08:00:00`;
  }
}
