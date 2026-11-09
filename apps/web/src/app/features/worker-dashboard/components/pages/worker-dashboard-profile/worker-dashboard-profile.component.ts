import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import {
  WorkerProfileUpdatePayload,
  WorkerScheduleItem,
} from '../../../models/worker-profile.model';
import { LocationMapPickerComponent } from '../../../../worker-booking/components/molecules/location-map-picker/location-map-picker.component';
import { AvatarUploadPickerComponent } from '../../molecules/avatar-upload-picker/avatar-upload-picker.component';

export type DashboardSectionTab = 'profile' | 'rates' | 'location' | 'schedule' | 'all';

export interface DashboardSectionMenuItem {
  readonly id: DashboardSectionTab;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
}

@Component({
  selector: 'app-worker-dashboard-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LocationMapPickerComponent, AvatarUploadPickerComponent],
  templateUrl: './worker-dashboard-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardProfileComponent implements OnInit {
  private readonly dashboardApiService = inject(WorkerDashboardApiService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeDashboardSection = signal<DashboardSectionTab>('profile');

  readonly dashboardSectionMenuItems: readonly DashboardSectionMenuItem[] = [
    { id: 'profile', label: 'Profil & WhatsApp', shortLabel: 'Profil', icon: 'profile' },
    { id: 'rates', label: 'Tarif Layanan', shortLabel: 'Tarif', icon: 'rates' },
    { id: 'location', label: 'Lokasi & Radius', shortLabel: 'Lokasi', icon: 'location' },
    { id: 'schedule', label: 'Jadwal Kerja', shortLabel: 'Jadwal', icon: 'schedule' },
    { id: 'all', label: 'Semua Pengaturan', shortLabel: 'Semua', icon: 'all' },
  ];

  readonly workerRecordId = signal<string>('');
  readonly workerSlugIdentifier = signal<string>('');
  readonly workerFullName = signal<string>('');
  readonly workerProfessionZone = signal<string>('');
  readonly workerBioDescription = signal<string>('');
  readonly workerAvatarUrl = signal<string>('');
  readonly workerWhatsAppNumber = signal<string>('');

  readonly workerLookupSlugInput = signal<string>('');
  readonly suggestedWorkerSlugs: readonly string[] = [];

  readonly isProfileSubmitting = signal<boolean>(false);
  readonly isProfileLoading = signal<boolean>(false);
  readonly profileFeedbackSuccess = signal<string | null>(null);
  readonly profileFeedbackError = signal<string | null>(null);
  readonly clipboardFeedbackMessage = signal<string | null>(null);
  readonly inputValidationErrors = signal<Record<string, string>>({});

  readonly workerBasePrice = signal<number | null>(null);
  readonly workerRateType = signal<'HOURLY' | 'UNIT'>('HOURLY');
  readonly isRatesSubmitting = signal<boolean>(false);
  readonly ratesFeedbackSuccess = signal<string | null>(null);
  readonly ratesFeedbackError = signal<string | null>(null);
  readonly ratesValidationErrors = signal<Record<string, string>>({});

  readonly workerLat = signal<number | null>(null);
  readonly workerLng = signal<number | null>(null);
  readonly workerMaxRadiusKm = signal<number>(10);
  readonly workerFreeRadiusKm = signal<number>(3);
  readonly workerExtraFeePerKm = signal<number>(0);
  readonly isLocationSubmitting = signal<boolean>(false);
  readonly locationFeedbackSuccess = signal<string | null>(null);
  readonly locationFeedbackError = signal<string | null>(null);
  readonly locationValidationErrors = signal<Record<string, string>>({});

  readonly workerSchedules = signal<WorkerScheduleItem[]>([]);
  readonly isScheduleLoading = signal<boolean>(false);
  readonly isScheduleSubmitting = signal<boolean>(false);
  readonly scheduleFeedbackSuccess = signal<string | null>(null);
  readonly scheduleFeedbackError = signal<string | null>(null);

  readonly formattedBasePricePreview = computed(() => {
    const price = this.workerBasePrice();
    if (price === null || price === undefined || Number.isNaN(price) || price <= 0) {
      return null;
    }
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
    const unitLabel = (this.workerRateType() || '').toUpperCase() === 'UNIT' ? 'Sesi' : 'Jam';
    return `${formatted} / ${unitLabel}`;
  });

  readonly formattedExtraFeePreview = computed(() => {
    const fee = this.workerExtraFeePerKm();
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(fee);
  });

  private clipboardTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly isStoreOnline = signal<boolean>(true);

  toggleStoreStatus(): void {
    this.isStoreOnline.update((val) => !val);
  }

  saveAllSettings(): void {
    const currentTab = this.activeDashboardSection();
    if (currentTab === 'rates') {
      this.submitRatesUpdate();
    } else if (currentTab === 'location') {
      this.submitLocationSettingsUpdate();
    } else if (currentTab === 'schedule') {
      this.submitScheduleUpdate();
    } else {
      this.submitProfileUpdate();
    }
  }

  readonly publicProfileRelativeUrl = computed(() => {
    const slug = this.workerSlugIdentifier().trim();
    return slug ? `/${slug}` : '';
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.clipboardTimeoutId !== null) {
        clearTimeout(this.clipboardTimeoutId);
        this.clipboardTimeoutId = null;
      }
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const querySlug = params.get('slug');
        if (querySlug && querySlug.trim()) {
          this.loadExistingWorkerProfile(querySlug.trim());
        }
        const querySection = params.get('section');
        if (
          querySection === 'profile' ||
          querySection === 'rates' ||
          querySection === 'location' ||
          querySection === 'schedule' ||
          querySection === 'all'
        ) {
          this.activeDashboardSection.set(querySection);
        }
      });
  }

  setActiveDashboardSection(section: DashboardSectionTab): void {
    this.activeDashboardSection.set(section);
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { section },
      queryParamsHandling: 'merge',
    });
  }

  loadProfileByLookupInput(): void {
    const slug = this.workerLookupSlugInput().trim();
    if (!slug) return;
    this.loadExistingWorkerProfile(slug);
  }

  selectPresetSlug(slug: string): void {
    this.workerLookupSlugInput.set(slug);
    this.loadExistingWorkerProfile(slug);
  }

  resetWorkerSelection(): void {
    this.workerRecordId.set('');
    this.workerSlugIdentifier.set('');
    this.workerFullName.set('');
    this.workerProfessionZone.set('');
    this.workerBioDescription.set('');
    this.workerAvatarUrl.set('');
    this.workerWhatsAppNumber.set('');
    this.workerBasePrice.set(null);
    this.workerRateType.set('HOURLY');
    this.workerLat.set(null);
    this.workerLng.set(null);
    this.workerMaxRadiusKm.set(10);
    this.workerFreeRadiusKm.set(3);
    this.workerExtraFeePerKm.set(0);
    this.profileFeedbackSuccess.set(null);
    this.profileFeedbackError.set(null);
    this.ratesFeedbackSuccess.set(null);
    this.ratesFeedbackError.set(null);
    this.ratesValidationErrors.set({});
    this.locationFeedbackSuccess.set(null);
    this.locationFeedbackError.set(null);
    this.locationValidationErrors.set({});
    this.workerSchedules.set([]);
    this.scheduleFeedbackSuccess.set(null);
    this.scheduleFeedbackError.set(null);
    this.router.navigate([], { queryParams: { slug: null }, queryParamsHandling: 'merge' });
  }

  loadExistingWorkerProfile(slug: string): void {
    const sanitizedSlug = slug.trim().toLowerCase();
    this.isProfileLoading.set(true);
    this.profileFeedbackError.set(null);
    this.ratesFeedbackError.set(null);
    this.locationFeedbackError.set(null);
    this.scheduleFeedbackError.set(null);
    this.workerLookupSlugInput.set(sanitizedSlug);

    this.dashboardApiService
      .fetchWorkerProfile(sanitizedSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isProfileLoading.set(false);
          if (response.success && response.data) {
            this.populateWorkerProfileState(response.data.id, {
              slug: response.data.slug,
              name: response.data.name,
              zone: response.data.zone,
              bio: response.data.bio,
              avatar_url: response.data.avatar_url,
              whatsapp_number: response.data.whatsapp_number,
              base_price: response.data.base_price,
              rate_type: response.data.rate_type,
              lat: response.data.lat,
              lng: response.data.lng,
              max_radius_km: response.data.max_radius_km,
              free_radius_km: response.data.free_radius_km,
              extra_fee_per_km: response.data.extra_fee_per_km,
            });
            this.loadWorkerSchedules(response.data.id || sanitizedSlug);
            this.router.navigate([], {
              queryParams: { slug: sanitizedSlug },
              queryParamsHandling: 'merge',
            });
          }
        },
        error: () => {
          this.isProfileLoading.set(false);
          this.profileFeedbackError.set(
            'Gagal memuat profil pekerja. Periksa slug atau coba beberapa saat lagi.'
          );
        },
      });
  }

  populateWorkerProfileState(
    id: string,
    profile: {
      slug: string;
      name: string;
      zone: string;
      bio?: string;
      avatar_url?: string;
      whatsapp_number?: string;
      base_price?: number;
      rate_type?: 'HOURLY' | 'UNIT' | string;
      lat?: number | null;
      lng?: number | null;
      max_radius_km?: number;
      free_radius_km?: number;
      extra_fee_per_km?: number;
    }
  ): void {
    this.workerRecordId.set(id);
    this.workerSlugIdentifier.set(profile.slug);
    this.workerFullName.set(profile.name);
    this.workerProfessionZone.set(profile.zone);
    this.workerBioDescription.set(profile.bio || '');
    this.workerAvatarUrl.set(profile.avatar_url || '');
    this.workerWhatsAppNumber.set(profile.whatsapp_number || '');

    if (profile.base_price !== undefined && profile.base_price !== null && !Number.isNaN(profile.base_price) && profile.base_price > 0) {
      this.workerBasePrice.set(profile.base_price);
    } else {
      this.workerBasePrice.set(null);
    }

    const normalizedRateType = (profile.rate_type || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'HOURLY';
    this.workerRateType.set(normalizedRateType);

    if (profile.lat !== undefined && profile.lat !== null && !Number.isNaN(profile.lat)) {
      this.workerLat.set(profile.lat);
    } else {
      this.workerLat.set(null);
    }

    if (profile.lng !== undefined && profile.lng !== null && !Number.isNaN(profile.lng)) {
      this.workerLng.set(profile.lng);
    } else {
      this.workerLng.set(null);
    }

    if (profile.max_radius_km !== undefined && profile.max_radius_km !== null && profile.max_radius_km > 0) {
      this.workerMaxRadiusKm.set(profile.max_radius_km);
    } else {
      this.workerMaxRadiusKm.set(10);
    }

    if (profile.free_radius_km !== undefined && profile.free_radius_km !== null && profile.free_radius_km >= 0) {
      this.workerFreeRadiusKm.set(profile.free_radius_km);
    } else {
      this.workerFreeRadiusKm.set(3);
    }

    if (profile.extra_fee_per_km !== undefined && profile.extra_fee_per_km !== null && profile.extra_fee_per_km >= 0) {
      this.workerExtraFeePerKm.set(profile.extra_fee_per_km);
    } else {
      this.workerExtraFeePerKm.set(0);
    }
  }

  onBasePriceChange(rawValue: unknown): void {
    this.clearRatesValidationError('base_price');
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      this.workerBasePrice.set(null);
      return;
    }
    const num = Number(rawValue);
    if (Number.isNaN(num)) {
      this.workerBasePrice.set(null);
      return;
    }
    this.workerBasePrice.set(num);
  }

  validateRatesInput(): boolean {
    const errors: Record<string, string> = {};
    const price = this.workerBasePrice();

    if (price === null || price === undefined || Number.isNaN(price) || price <= 0) {
      errors['base_price'] = 'Nominal tarif dasar harus lebih besar dari Rp 0.';
    }

    const type = (this.workerRateType() || '').toUpperCase();
    if (type !== 'HOURLY' && type !== 'UNIT') {
      errors['rate_type'] = 'Pilih tipe tarif yang valid (Tarif Per Jam atau Tarif Per Sesi).';
    }

    this.ratesValidationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  clearRatesValidationError(fieldName: string): void {
    const current = { ...this.ratesValidationErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.ratesValidationErrors.set(current);
    }
  }

  setRateType(type: 'HOURLY' | 'UNIT'): void {
    this.workerRateType.set(type);
    this.clearRatesValidationError('rate_type');
  }

  submitRatesUpdate(): void {
    if (!this.validateRatesInput()) {
      return;
    }

    const workerId = this.workerRecordId().trim();
    if (!workerId) {
      this.ratesFeedbackError.set(
        'ID pekerja belum tersedia. Silakan muat profil terlebih dahulu.'
      );
      return;
    }

    this.isRatesSubmitting.set(true);
    this.ratesFeedbackSuccess.set(null);
    this.ratesFeedbackError.set(null);

    const payload = {
      base_price: Number(this.workerBasePrice()),
      rate_type: this.workerRateType(),
    };

    this.dashboardApiService
      .updateWorkerRates(workerId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isRatesSubmitting.set(false);
          if (response.success) {
            this.ratesFeedbackSuccess.set(
              response.message || 'Pengaturan tarif pekerja berhasil diperbarui!'
            );
            if (response.data) {
              if (response.data.base_price && !Number.isNaN(response.data.base_price) && response.data.base_price > 0) {
                this.workerBasePrice.set(response.data.base_price);
              }
              const returnedType = (response.data.rate_type || '').toUpperCase();
              if (returnedType === 'UNIT' || returnedType === 'HOURLY') {
                this.workerRateType.set(returnedType);
              }
            }
          }
        },
        error: (err) => {
          this.isRatesSubmitting.set(false);
          const serverMsg = err?.error?.message;
          this.ratesFeedbackError.set(
            serverMsg ||
              'Gagal menyimpan pengaturan tarif pekerja. Silakan periksa koneksi atau coba kembali.'
          );
        },
      });
  }

  validateProfileInput(): boolean {
    const errors: Record<string, string> = {};

    if (!this.workerFullName().trim()) {
      errors['name'] = 'Nama lengkap pekerja wajib diisi.';
    } else if (this.workerFullName().trim().length < 3) {
      errors['name'] = 'Nama lengkap pekerja minimal 3 karakter.';
    }

    const wa = this.workerWhatsAppNumber().trim();
    if (!wa) {
      errors['whatsapp_number'] = 'Nomor WhatsApp bisnis pekerja wajib diisi.';
    } else if (!/^[0-9+\s-]+$/.test(wa)) {
      errors['whatsapp_number'] =
        'Nomor WhatsApp hanya boleh berisi angka dan tanda plus atau strip.';
    } else if ((wa.includes('+') && !wa.startsWith('+')) || (wa.match(/\+/g) || []).length > 1) {
      errors['whatsapp_number'] =
        'Tanda plus (+) hanya boleh berada di awal nomor telepon sebagai awalan kode negara.';
    } else {
      const sanitized = wa.replace(/\D/g, '');
      if (sanitized.length < 10 || sanitized.length > 16) {
        errors['whatsapp_number'] =
          'Nomor WhatsApp harus terdiri dari 10 hingga 16 digit angka.';
      } else if (sanitized.startsWith('0')) {
        errors['whatsapp_number'] =
          'Gunakan format internasional diawali kode negara (contoh: 628123456789, bukan 0812).';
      }
    }

    if (this.workerBioDescription().trim().length > 500) {
      errors['bio'] = 'Deskripsi profil maksimal 500 karakter.';
    }

    this.inputValidationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  clearInputValidationError(fieldName: string): void {
    const current = { ...this.inputValidationErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.inputValidationErrors.set(current);
    }
  }

  submitProfileUpdate(): void {
    if (!this.validateProfileInput()) {
      return;
    }

    const workerId = this.workerRecordId().trim();
    if (!workerId) {
      this.profileFeedbackError.set(
        'ID pekerja belum tersedia. Silakan muat profil terlebih dahulu.'
      );
      return;
    }

    this.isProfileSubmitting.set(true);
    this.profileFeedbackSuccess.set(null);
    this.profileFeedbackError.set(null);

    const sanitizedWhatsApp = this.workerWhatsAppNumber().trim().replace(/\D/g, '');
    const payload: WorkerProfileUpdatePayload = {
      name: this.workerFullName().trim(),
      zone: this.workerProfessionZone().trim(),
      bio: this.workerBioDescription().trim(),
      avatar_url: this.workerAvatarUrl().trim(),
      whatsapp_number: sanitizedWhatsApp,
    };

    this.dashboardApiService
      .updateWorkerProfile(workerId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isProfileSubmitting.set(false);
          if (response.success) {
            this.profileFeedbackSuccess.set('Profil pekerja berhasil diperbarui!');
            if (response.data) {
              this.workerFullName.set(response.data.name);
              this.workerProfessionZone.set(response.data.zone);
              this.workerBioDescription.set(response.data.bio || '');
              this.workerAvatarUrl.set(response.data.avatar_url || '');
              this.workerSlugIdentifier.set(response.data.slug);
              if (response.data.whatsapp_number !== undefined) {
                this.workerWhatsAppNumber.set(response.data.whatsapp_number || '');
              }
            }
          }
        },
        error: (err) => {
          this.isProfileSubmitting.set(false);
          const serverMsg = err?.error?.message;
          this.profileFeedbackError.set(
            serverMsg ||
              'Gagal menyimpan perubahan profil pekerja. Silakan periksa koneksi atau coba kembali.'
          );
        },
      });
  }

  async copyPublicProfileLink(): Promise<void> {
    const relativeUrl = this.publicProfileRelativeUrl();
    if (!relativeUrl) return;

    let fullUrl = relativeUrl;
    if (typeof window !== 'undefined' && window.location) {
      fullUrl = `${window.location.origin}${relativeUrl}`;
    }

    let copied = false;
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(fullUrl);
        copied = true;
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      copied = false;
    }

    if (copied) {
      this.clipboardFeedbackMessage.set('Tautan berhasil disalin!');
      if (this.clipboardTimeoutId !== null) {
        clearTimeout(this.clipboardTimeoutId);
      }
      this.clipboardTimeoutId = setTimeout(() => {
        this.clipboardFeedbackMessage.set(null);
        this.clipboardTimeoutId = null;
      }, 3000);
    } else {
      this.clipboardFeedbackMessage.set('Gagal menyalin tautan');
    }
  }

  onWorkerCoordinatesChanged(coords: { lat: number; lng: number }): void {
    this.workerLat.set(coords.lat);
    this.workerLng.set(coords.lng);
    this.clearLocationValidationError('coordinates');
  }

  onMaxRadiusKmChange(rawVal: unknown): void {
    this.clearLocationValidationError('max_radius_km');
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val > 0) {
      this.workerMaxRadiusKm.set(val);
    }
  }

  onFreeRadiusKmChange(rawVal: unknown): void {
    this.clearLocationValidationError('free_radius_km');
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val >= 0) {
      this.workerFreeRadiusKm.set(val);
    }
  }

  onExtraFeePerKmChange(rawVal: unknown): void {
    this.clearLocationValidationError('extra_fee_per_km');
    const val = Number(rawVal);
    if (!Number.isNaN(val) && val >= 0) {
      this.workerExtraFeePerKm.set(val);
    }
  }

  clearLocationValidationError(fieldName: string): void {
    const current = { ...this.locationValidationErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.locationValidationErrors.set(current);
    }
  }

  validateLocationSettingsInput(): boolean {
    const errors: Record<string, string> = {};

    if (this.workerLat() === null || this.workerLng() === null) {
      errors['coordinates'] =
        'Titik koordinat (latitude & longitude) rumah atau pangkalan kerja wajib ditentukan.';
    }

    if (this.workerMaxRadiusKm() <= 0) {
      errors['max_radius_km'] = 'Batas radius maksimal harus lebih besar dari 0 km.';
    }

    if (this.workerFreeRadiusKm() < 0) {
      errors['free_radius_km'] = 'Radius bebas ongkir tidak boleh bernilai negatif.';
    }

    if (this.workerFreeRadiusKm() > this.workerMaxRadiusKm()) {
      errors['free_radius_km'] =
        'Radius bebas ongkir tidak boleh melebihi batas radius jangkauan maksimal.';
    }

    if (this.workerExtraFeePerKm() < 0) {
      errors['extra_fee_per_km'] = 'Tarif per km tidak boleh bernilai negatif.';
    }

    this.locationValidationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  submitLocationSettingsUpdate(): void {
    if (!this.validateLocationSettingsInput()) {
      return;
    }

    const workerId = this.workerRecordId().trim();
    if (!workerId) {
      this.locationFeedbackError.set(
        'ID pekerja belum tersedia. Silakan muat profil terlebih dahulu.'
      );
      return;
    }

    this.isLocationSubmitting.set(true);
    this.locationFeedbackSuccess.set(null);
    this.locationFeedbackError.set(null);

    const payload = {
      lat: Number(this.workerLat()),
      lng: Number(this.workerLng()),
      max_radius_km: Number(this.workerMaxRadiusKm()),
      free_radius_km: Number(this.workerFreeRadiusKm()),
      extra_fee_per_km: Number(this.workerExtraFeePerKm()),
    };

    this.dashboardApiService
      .updateWorkerLocationSettings(workerId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLocationSubmitting.set(false);
          if (response.success) {
            this.locationFeedbackSuccess.set(
              response.message || 'Pengaturan lokasi dan radius jangkauan berhasil disimpan!'
            );
            if (response.data) {
              if (response.data.lat !== undefined && response.data.lat !== null) {
                this.workerLat.set(response.data.lat);
              }
              if (response.data.lng !== undefined && response.data.lng !== null) {
                this.workerLng.set(response.data.lng);
              }
              if (response.data.max_radius_km) {
                this.workerMaxRadiusKm.set(response.data.max_radius_km);
              }
              if (response.data.free_radius_km !== undefined) {
                this.workerFreeRadiusKm.set(response.data.free_radius_km);
              }
              if (response.data.extra_fee_per_km !== undefined) {
                this.workerExtraFeePerKm.set(response.data.extra_fee_per_km);
              }
            }
          }
        },
        error: (err) => {
          this.isLocationSubmitting.set(false);
          const serverMsg = err?.error?.message;
          this.locationFeedbackError.set(
            serverMsg ||
              'Gagal menyimpan pengaturan lokasi pekerja. Silakan periksa koneksi atau coba kembali.'
          );
        },
      });
  }

  loadWorkerSchedules(workerIdOrSlug: string): void {
    const sanitized = workerIdOrSlug.trim();
    if (!sanitized) return;

    this.isScheduleLoading.set(true);
    this.scheduleFeedbackError.set(null);

    this.dashboardApiService
      .fetchWorkerSchedules(sanitized)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isScheduleLoading.set(false);
          if (response.success && response.data && response.data.length > 0) {
            this.workerSchedules.set(this.sortSchedulesMondayFirst(response.data));
          } else {
            this.workerSchedules.set(this.createDefaultWeeklySchedule());
          }
        },
        error: () => {
          this.isScheduleLoading.set(false);
          this.workerSchedules.set(this.createDefaultWeeklySchedule());
        },
      });
  }

  createDefaultWeeklySchedule(): WorkerScheduleItem[] {
    const days = [
      { day_of_week: 1, day_name: 'Senin' },
      { day_of_week: 2, day_name: 'Selasa' },
      { day_of_week: 3, day_name: 'Rabu' },
      { day_of_week: 4, day_name: 'Kamis' },
      { day_of_week: 5, day_name: 'Jumat' },
      { day_of_week: 6, day_name: 'Sabtu' },
      { day_of_week: 0, day_name: 'Minggu' },
    ];
    return days.map((d) => ({
      day_of_week: d.day_of_week,
      day_name: d.day_name,
      is_active: d.day_of_week !== 0,
      slot_morning: true,
      slot_afternoon: true,
      slot_evening: false,
    }));
  }

  private sortSchedulesMondayFirst(items: WorkerScheduleItem[]): WorkerScheduleItem[] {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const map = new Map<number, WorkerScheduleItem>();
    for (const item of items) {
      map.set(item.day_of_week, item);
    }
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((dayNum) => {
      const existing = map.get(dayNum);
      if (existing) {
        return {
          ...existing,
          day_name: existing.day_name || dayNames[dayNum],
        };
      }
      return {
        day_of_week: dayNum,
        day_name: dayNames[dayNum],
        is_active: dayNum !== 0,
        slot_morning: true,
        slot_afternoon: true,
        slot_evening: false,
      };
    });
  }

  toggleScheduleDayActive(dayOfWeek: number): void {
    const current = this.workerSchedules();
    const updated = current.map((item) => {
      if (item.day_of_week === dayOfWeek) {
        return { ...item, is_active: !item.is_active };
      }
      return item;
    });
    this.workerSchedules.set(updated);
  }

  toggleScheduleSlot(
    dayOfWeek: number,
    slotKey: 'slot_morning' | 'slot_afternoon' | 'slot_evening'
  ): void {
    const current = this.workerSchedules();
    const updated = current.map((item) => {
      if (item.day_of_week === dayOfWeek) {
        return { ...item, [slotKey]: !item[slotKey] };
      }
      return item;
    });
    this.workerSchedules.set(updated);
  }

  submitScheduleUpdate(): void {
    const workerId = this.workerRecordId().trim();
    if (!workerId) {
      this.scheduleFeedbackError.set(
        'ID pekerja belum tersedia. Silakan muat profil terlebih dahulu.'
      );
      return;
    }

    this.isScheduleSubmitting.set(true);
    this.scheduleFeedbackSuccess.set(null);
    this.scheduleFeedbackError.set(null);

    this.dashboardApiService
      .updateWorkerSchedules(workerId, this.workerSchedules())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isScheduleSubmitting.set(false);
          if (response.success) {
            this.scheduleFeedbackSuccess.set(
              response.message || 'Konfigurasi jadwal kerja mingguan berhasil disimpan!'
            );
            if (response.data && response.data.length > 0) {
              this.workerSchedules.set(this.sortSchedulesMondayFirst(response.data));
            }
          }
        },
        error: (err) => {
          this.isScheduleSubmitting.set(false);
          const serverMsg = err?.error?.message;
          this.scheduleFeedbackError.set(
            serverMsg ||
              'Gagal menyimpan konfigurasi jadwal kerja. Silakan periksa koneksi atau coba kembali.'
          );
        },
      });
  }
}

