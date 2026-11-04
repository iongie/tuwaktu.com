import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { WorkerDashboardApiService } from './worker-dashboard-api.service';
import {
  WorkerProfileUpdatePayload,
  WorkerRateUpdatePayload,
  WorkerLocationSettingsUpdatePayload,
  WorkerScheduleItem,
  WorkerServiceCatalogItem,
} from '../models/worker-profile.model';

export const DEFAULT_WORKER_SERVICES: WorkerServiceCatalogItem[] = [
  {
    id: 'srv-dcl-01',
    code: 'DCL-01',
    name: 'Deep Clean Detailing',
    description:
      'Pembersihan kerak kamar mandi membandel, kerak minyak dapur, desinfeksi menyeluruh & sedot tungau matras bertekanan tinggi untuk hasil higienis tuntas.',
    price: 65000,
    base_price: 65000,
    rate_type: 'HOURLY',
    duration_minutes: 120,
    min_hours: 2.0,
    equipment_label: 'Polisher & Vac Industri',
    equipment_badge: 'Alat Berat Industri Siap Pakai',
    equipment_icon: 'verified',
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_PTYqBj7kWz6kDcBIbeqy7Qk6ULYNaPUGnT7rQMruEPhCK6fBXGJhwpQx77ma_hufKEfzP1vn4S2tZ57dWIYRbANbwBxcCP6JVZpQ1Fu1QHdDrioV6J_o7iJ7pWKqD2wUw6C1wg8vp-7fLARDBREYW9WHja4w2wYKc9RvnYUww0an9MTLf1W76ZWrf-pQPUtjDDfQ5sOS3ctx1tfy_o8824LsHgIoVKkMHJGXbDs',
    tags: [
      'Bahan Kimia Ramah Lingkungan',
      'Termasuk Mesin Polisher',
      'Alat & Cairan Lengkap',
    ],
    status: 'ACTIVE',
    is_public: true,
  },
  {
    id: 'srv-gcl-02',
    code: 'GCL-02',
    name: 'General Clean',
    description:
      'Penyapuan, pengepelan lantai higienis, pengelapan debu permukaan meja & lemari, perapihan kasur, serta pembuangan sampah rutin harian untuk hunian rapi seketika.',
    price: 150000,
    base_price: 150000,
    rate_type: 'UNIT',
    duration_minutes: 120,
    max_hours: 2.0,
    equipment_label: 'Alat Ringan Bawa Sendiri',
    equipment_badge: 'Pembersihan Cepat & Efisien',
    equipment_icon: 'flash_on',
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIUz4rsfL--4VOkoeNpRvEL8Ln807ps7IRkWKk32oIEhJ-7P9oDQ8eFUbtjurXjTvOrzr_ODiP9uZRnbHBWp5L9Hqs2vCLUeK_j0cFrXdJfak0eY8vcOfgJg6FZ0LeoaeqF9sYiFFTSyeWAKxYnGXb-ajsJyMSzeXsHgVMXWy1Sxp0YSqbD9uU0deTMIvtGO6vB950_iVs0ij0rzjhhGjWo94TDPNnU63kkSORgKY',
    tags: ['Alat Bawa Sendiri', 'Cocok Apartemen / Studio', 'Cepat Bersih'],
    status: 'ACTIVE',
    is_public: true,
  },
  {
    id: 'srv-acp-03',
    code: 'ACP-03',
    name: 'Pembersihan Karpet & Sofa Lama',
    description:
      'Pembersihan kain basah dan ekstraksi noda mendalam pada sofa kain serta karpet tebal.',
    price: 200000,
    base_price: 200000,
    rate_type: 'UNIT',
    duration_minutes: 90,
    max_hours: 1.5,
    equipment_label: 'Ekstraktor Vacuum Portabel',
    equipment_badge: 'Perawatan Kain Khusus',
    equipment_icon: 'archive',
    image_url: '',
    tags: ['Khusus Sofa', 'Bahan Anti Bau'],
    status: 'ARCHIVED',
    is_public: false,
  },
];

export const DEFAULT_WEEKLY_SCHEDULES: WorkerScheduleItem[] = [
  {
    day_of_week: 1,
    day_name: 'Senin',
    is_active: true,
    slot_morning: true,
    slot_afternoon: true,
    slot_evening: false,
  },
  {
    day_of_week: 2,
    day_name: 'Selasa',
    is_active: true,
    slot_morning: true,
    slot_afternoon: true,
    slot_evening: false,
  },
  {
    day_of_week: 3,
    day_name: 'Rabu',
    is_active: true,
    slot_morning: true,
    slot_afternoon: true,
    slot_evening: false,
  },
  {
    day_of_week: 4,
    day_name: 'Kamis',
    is_active: true,
    slot_morning: true,
    slot_afternoon: true,
    slot_evening: false,
  },
  {
    day_of_week: 5,
    day_name: 'Jumat',
    is_active: true,
    slot_morning: true,
    slot_afternoon: true,
    slot_evening: false,
  },
  {
    day_of_week: 6,
    day_name: 'Sabtu',
    is_active: true,
    slot_morning: true,
    slot_afternoon: true,
    slot_evening: false,
  },
  {
    day_of_week: 0,
    day_name: 'Minggu',
    is_active: false,
    slot_morning: false,
    slot_afternoon: false,
    slot_evening: false,
  },
];


export interface WhatsAppPreviewSampleData {
  readonly clientName: string;
  readonly serviceName: string;
  readonly scheduleDateTime: string;
  readonly clientAddress: string;
  readonly distanceKm: string;
  readonly travelFeeBreakdown: string;
  readonly totalCost: string;
  readonly specialNotes: string;
  readonly mapsLocationUrl: string;
}

export const DEFAULT_WHATSAPP_SAMPLE_DATA: WhatsAppPreviewSampleData = {
  clientName: 'Bima Satria',
  serviceName: 'Deep Clean Detailing (2.5 Jam)',
  scheduleDateTime: 'Sabtu, 25 Mei (13:00 - 15:30 WIB)',
  clientAddress: 'Jl. Senopati Dalam No. 4A',
  distanceKm: '4.2 km',
  travelFeeBreakdown: 'Jasa Rp 162.500 + Ongkir Rp 3.600',
  totalCost: 'Rp 166.100',
  specialNotes: 'Tolong bawa disinfektan sendiri, fokus kerak kamar mandi utama',
  mapsLocationUrl: 'https://maps.google.com/?q=-6.2297,106.8093',
};

export function buildDefaultWhatsAppTemplate(workerFullName?: string): string {
  const name = (workerFullName || '').trim() || 'Sarah Melinda';
  const firstName = name.split(' ')[0] || name;
  return `Halo Kak ${name}! Saya ingin memesan jadwal lewat Tuwaktu:
• Layanan: {{LAYANAN}}
• Jadwal: {{TANGGAL_JAM}}
• Alamat: {{ALAMAT}} ({{JARAK_KM}})
• Catatan: {{CATATAN}}
• Rincian: {{ONGKOS_JALAN}}
• Total: {{TOTAL_BIAYA}} (Bebas Biaya Admin)

Mohon konfirmasinya ya Kak ${firstName}, terima kasih!
[VERIFIKASI SISTEM TUWAKTU ✓✓]`;
}

export function formatWhatsAppDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return '+62 812-8899-2211';
  }
  if (digits.startsWith('62')) {
    const rest = digits.substring(2);
    if (rest.length >= 8) {
      const p1 = rest.substring(0, 3);
      const p2 = rest.substring(3, 7);
      const p3 = rest.substring(7);
      return `+62 ${p1}-${p2}-${p3}`;
    }
    return `+62 ${rest}`;
  }
  if (digits.startsWith('0')) {
    const rest = digits.substring(1);
    if (rest.length >= 8) {
      const p1 = rest.substring(0, 3);
      const p2 = rest.substring(3, 7);
      const p3 = rest.substring(7);
      return `+62 ${p1}-${p2}-${p3}`;
    }
    return `+62 ${rest}`;
  }
  return `+${digits}`;
}

export const STORAGE_WHATSAPP_CONFIG_KEY_PREFIX = 'tuwaktu_worker_whatsapp_config_';

export function normalizeWhatsAppNumberForWaMe(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (!digits) {
    return '6281288992211';
  }
  if (digits.startsWith('08')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits;
}

export function renderWhatsAppMessageText(
  template: string,
  sample: WhatsAppPreviewSampleData,
  includeGmaps: boolean,
  includeBreakdown: boolean,
  includeNotes: boolean
): string {
  let text = template;
  const alamatVal = includeGmaps
    ? `${sample.clientAddress} (${sample.mapsLocationUrl})`
    : sample.clientAddress;
  const rincianVal = includeBreakdown ? sample.travelFeeBreakdown : 'Rp 166.100 Nett';
  const catatanVal = includeNotes ? sample.specialNotes : '-';

  text = text.replace(/\{\{NAMA_KLIEN\}\}/g, sample.clientName);
  text = text.replace(/\{\{LAYANAN\}\}/g, sample.serviceName);
  text = text.replace(/\{\{TANGGAL_JAM\}\}/g, sample.scheduleDateTime);
  text = text.replace(/\{\{ALAMAT\}\}/g, alamatVal);
  text = text.replace(/\{\{JARAK_KM\}\}/g, sample.distanceKm);
  text = text.replace(/\{\{ONGKOS_JALAN\}\}/g, rincianVal);
  text = text.replace(/\{\{TOTAL_BIAYA\}\}/g, sample.totalCost);
  text = text.replace(/\{\{CATATAN\}\}/g, catatanVal);

  return text;
}

@Injectable({
  providedIn: 'root',
})
export class WorkerDashboardStore implements OnDestroy {
  private readonly apiService = inject(WorkerDashboardApiService);

  readonly workerRecordId = signal<string>('');
  readonly workerSlugIdentifier = signal<string>('');
  readonly workerFullName = signal<string>('');
  readonly workerProfessionZone = signal<string>('');
  readonly workerBioDescription = signal<string>('');
  readonly workerAvatarUrl = signal<string>('');
  readonly workerWhatsAppNumber = signal<string>('');

  readonly workerLookupSlugInput = signal<string>('');
  readonly isStoreOnline = signal<boolean>(true);

  readonly workerBasePrice = signal<number | null>(null);
  readonly workerRateType = signal<'HOURLY' | 'UNIT'>('HOURLY');

  readonly workerServices = signal<WorkerServiceCatalogItem[]>(DEFAULT_WORKER_SERVICES);
  readonly servicesActiveTab = signal<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  readonly isMobileSidebarOpen = signal<boolean>(false);
  readonly lastRatesSyncTimestamp = signal<string>('Hari ini, 14:32 WIB');
  readonly lastLocationSyncTimestamp = signal<string>('Hari ini, 14:32 WIB');
  readonly lastScheduleSyncTimestamp = signal<string>('Hari ini, 14:32 WIB');

  readonly activeServicesCount = computed(
    () => this.workerServices().filter((s) => s.status === 'ACTIVE').length
  );
  readonly draftServicesCount = computed(
    () => this.workerServices().filter((s) => s.status === 'DRAFT').length
  );
  readonly archivedServicesCount = computed(
    () => this.workerServices().filter((s) => s.status === 'ARCHIVED').length
  );
  readonly filteredServices = computed(() =>
    this.workerServices().filter((s) => s.status === this.servicesActiveTab())
  );

  readonly workerLat = signal<number | null>(-6.234129);
  readonly workerLng = signal<number | null>(106.852901);
  readonly workerMaxRadiusKm = signal<number>(5.0);
  readonly workerFreeRadiusKm = signal<number>(3.0);
  readonly workerExtraFeePerKm = signal<number>(3000);
  readonly workerBasecampAddress = signal<string>(
    'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan'
  );

  readonly workerSchedules = signal<WorkerScheduleItem[]>(DEFAULT_WEEKLY_SCHEDULES);
  readonly transitBufferMinutes = signal<number>(90);
  readonly autoPeakHourBuffer = signal<boolean>(true);
  readonly mandatoryLunchBreak = signal<boolean>(true);
  readonly isTodayEmergencyLocked = signal<boolean>(false);
  readonly orderLeadTimeHours = signal<number>(3);
  readonly autoBlockPersonalAgenda = signal<boolean>(true);
  readonly selectedScheduleDateSegment = signal<string>('Besok (25 Okt)');
  readonly isSlot3Locked = signal<boolean>(false);

  readonly isProfileLoading = signal<boolean>(false);
  readonly isProfileSubmitting = signal<boolean>(false);
  readonly isRatesSubmitting = signal<boolean>(false);
  readonly isLocationSubmitting = signal<boolean>(false);
  readonly isScheduleLoading = signal<boolean>(false);
  readonly isScheduleSubmitting = signal<boolean>(false);

  readonly profileFeedbackSuccess = signal<string | null>(null);
  readonly profileFeedbackError = signal<string | null>(null);
  readonly ratesFeedbackSuccess = signal<string | null>(null);
  readonly ratesFeedbackError = signal<string | null>(null);
  readonly locationFeedbackSuccess = signal<string | null>(null);
  readonly locationFeedbackError = signal<string | null>(null);
  readonly scheduleFeedbackSuccess = signal<string | null>(null);
  readonly scheduleFeedbackError = signal<string | null>(null);
  readonly planFeedbackSuccess = signal<string | null>(null);
  readonly boostFeedbackSuccess = signal<string | null>(null);
  readonly currentPlanTier = signal<'STARTER' | 'PRO' | 'FLEET'>('PRO');
  readonly activeBoostPackage = signal<'NONE' | 'FLASH_24H' | 'WEEKEND_72H' | 'WEEKLY_7D'>('WEEKEND_72H');
  readonly isBoostActive = signal<boolean>(true);
  readonly clipboardFeedbackMessage = signal<string | null>(null);

  readonly whatsappMessageTemplate = signal<string>(buildDefaultWhatsAppTemplate());
  readonly includeGmapsLocation = signal<boolean>(true);
  readonly includeCostBreakdown = signal<boolean>(true);
  readonly includeSpecialNotes = signal<boolean>(true);
  readonly isBackupNotificationEnabled = signal<boolean>(true);
  readonly otpFeedbackMessage = signal<string | null>(null);
  readonly isEditingWhatsAppNumber = signal<boolean>(false);
  readonly editWhatsAppNumberInput = signal<string>('');

  readonly inputValidationErrors = signal<Record<string, string>>({});
  readonly ratesValidationErrors = signal<Record<string, string>>({});
  readonly locationValidationErrors = signal<Record<string, string>>({});

  private clipboardTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private otpTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly hasActiveWorker = computed(() => !!this.workerRecordId().trim());

  readonly publicProfileRelativeUrl = computed(() => {
    const slug = this.workerSlugIdentifier().trim();
    return slug ? `/${slug}` : '';
  });

  readonly displayFormattedWhatsAppNumber = computed(() => {
    return formatWhatsAppDisplay(this.workerWhatsAppNumber());
  });

  readonly whatsappMessageCharacterCount = computed(() => {
    return this.whatsappMessageTemplate().length;
  });

  readonly renderedWhatsAppMessagePreview = computed(() => {
    return renderWhatsAppMessageText(
      this.whatsappMessageTemplate(),
      DEFAULT_WHATSAPP_SAMPLE_DATA,
      this.includeGmapsLocation(),
      this.includeCostBreakdown(),
      this.includeSpecialNotes()
    );
  });

  readonly generatedWhatsAppDeepLink = computed(() => {
    const cleanPhone = normalizeWhatsAppNumberForWaMe(this.workerWhatsAppNumber());
    const encodedText = encodeURIComponent(this.renderedWhatsAppMessagePreview());
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  });

  saveWhatsAppSettingsToStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const key = `${STORAGE_WHATSAPP_CONFIG_KEY_PREFIX}${this.workerSlugIdentifier() || 'default'}`;
      const config = {
        template: this.whatsappMessageTemplate(),
        includeGmaps: this.includeGmapsLocation(),
        includeBreakdown: this.includeCostBreakdown(),
        includeNotes: this.includeSpecialNotes(),
        backupNotification: this.isBackupNotificationEnabled(),
      };
      localStorage.setItem(key, JSON.stringify(config));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  loadWhatsAppSettingsFromStorage(slug?: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const key = `${STORAGE_WHATSAPP_CONFIG_KEY_PREFIX}${slug || this.workerSlugIdentifier() || 'default'}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        return false;
      }
      const config = JSON.parse(raw);
      if (typeof config?.template === 'string' && config.template.trim()) {
        this.whatsappMessageTemplate.set(config.template);
      }
      if (typeof config?.includeGmaps === 'boolean') {
        this.includeGmapsLocation.set(config.includeGmaps);
      }
      if (typeof config?.includeBreakdown === 'boolean') {
        this.includeCostBreakdown.set(config.includeBreakdown);
      }
      if (typeof config?.includeNotes === 'boolean') {
        this.includeSpecialNotes.set(config.includeNotes);
      }
      if (typeof config?.backupNotification === 'boolean') {
        this.isBackupNotificationEnabled.set(config.backupNotification);
      }
      return true;
    } catch {
      return false;
    }
  }

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

  readonly activeScheduleDaysCount = computed(() => {
    return this.workerSchedules().filter((item) => item.is_active).length;
  });

  toggleStoreStatus(): void {
    this.isStoreOnline.update((online) => !online);
  }

  resetWhatsAppTemplateToDefault(): void {
    this.whatsappMessageTemplate.set(buildDefaultWhatsAppTemplate(this.workerFullName()));
    this.includeGmapsLocation.set(true);
    this.includeCostBreakdown.set(true);
    this.includeSpecialNotes.set(true);
    this.saveWhatsAppSettingsToStorage();
  }

  setWhatsAppTemplate(template: string): void {
    this.whatsappMessageTemplate.set(template);
    this.saveWhatsAppSettingsToStorage();
  }

  insertTokenIntoWhatsAppTemplate(token: string, cursorPos?: number): void {
    const current = this.whatsappMessageTemplate();
    if (cursorPos === undefined || cursorPos === null || cursorPos < 0 || cursorPos > current.length) {
      this.whatsappMessageTemplate.set(current + ' ' + token);
    } else {
      const before = current.substring(0, cursorPos);
      const after = current.substring(cursorPos);
      this.whatsappMessageTemplate.set(before + token + after);
    }
    this.saveWhatsAppSettingsToStorage();
  }

  toggleGmapsOption(): void {
    this.includeGmapsLocation.update((val) => !val);
    this.saveWhatsAppSettingsToStorage();
  }

  toggleBreakdownOption(): void {
    this.includeCostBreakdown.update((val) => !val);
    this.saveWhatsAppSettingsToStorage();
  }

  toggleNotesOption(): void {
    this.includeSpecialNotes.update((val) => !val);
    this.saveWhatsAppSettingsToStorage();
  }

  toggleBackupNotification(): void {
    this.isBackupNotificationEnabled.update((val) => !val);
    this.saveWhatsAppSettingsToStorage();
  }

  triggerOtpTest(): void {
    this.clearOtpTimer();
    this.otpFeedbackMessage.set('Kode Dikirim ✓');
    this.otpTimeoutId = setTimeout(() => {
      this.otpFeedbackMessage.set(null);
      this.otpTimeoutId = null;
    }, 3000);
    const timerObj = this.otpTimeoutId as unknown;
    if (
      timerObj &&
      typeof timerObj === 'object' &&
      'unref' in timerObj &&
      typeof (timerObj as { unref: () => void }).unref === 'function'
    ) {
      (timerObj as { unref: () => void }).unref();
    }
  }

  clearOtpTimer(): void {
    if (this.otpTimeoutId) {
      clearTimeout(this.otpTimeoutId);
      this.otpTimeoutId = null;
    }
  }

  startEditingWhatsAppNumber(): void {
    this.editWhatsAppNumberInput.set(this.workerWhatsAppNumber() || '6281288992211');
    this.isEditingWhatsAppNumber.set(true);
  }

  cancelEditingWhatsAppNumber(): void {
    this.isEditingWhatsAppNumber.set(false);
    this.editWhatsAppNumberInput.set('');
  }

  saveEditedWhatsAppNumber(): void {
    let newNumber = this.editWhatsAppNumberInput().trim();
    const cleanDigits = newNumber.replace(/\D/g, '');
    if (cleanDigits.startsWith('08')) {
      newNumber = '62' + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith('8')) {
      newNumber = '62' + cleanDigits;
    } else if (cleanDigits) {
      newNumber = cleanDigits;
    }
    this.workerWhatsAppNumber.set(newNumber);
    this.isEditingWhatsAppNumber.set(false);
    this.clearInputValidationError('whatsapp_number');
    this.saveWhatsAppSettingsToStorage();

    if (this.hasActiveWorker()) {
      this.submitProfileUpdate();
    }
  }

  openWhatsAppDeepLink(): void {
    if (typeof window !== 'undefined') {
      window.open(this.generatedWhatsAppDeepLink(), '_blank', 'noopener,noreferrer');
    }
  }

  setRatesActiveTab(tab: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'): void {
    this.servicesActiveTab.set(tab);
  }

  updateRatesSyncTimestamp(): void {
    const formattedTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.lastRatesSyncTimestamp.set(`Hari ini, ${formattedTime} WIB`);
  }

  updateLocationSyncTimestamp(): void {
    const formattedTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.lastLocationSyncTimestamp.set(`Hari ini, ${formattedTime} WIB`);
  }

  toggleServiceVisibility(serviceId: string): void {
    this.workerServices.update((services) =>
      services.map((item) =>
        item.id === serviceId ? { ...item, is_public: !item.is_public } : item
      )
    );
    this.updateRatesSyncTimestamp();
  }

  updateServiceCatalogItem(
    serviceId: string,
    patch: Partial<WorkerServiceCatalogItem>
  ): void {
    this.workerServices.update((services) =>
      services.map((item) => {
        if (item.id === serviceId) {
          const updated = { ...item, ...patch };
          if (patch.price !== undefined) {
            updated.base_price = patch.price;
          }
          return updated;
        }
        return item;
      })
    );

    const updatedItem = this.workerServices().find((s) => s.id === serviceId);
    if (updatedItem && patch.price !== undefined && patch.price > 0) {
      this.workerBasePrice.set(patch.price);
    }
    if (updatedItem && patch.rate_type !== undefined) {
      this.workerRateType.set(patch.rate_type);
    }
    this.updateRatesSyncTimestamp();
  }

  addNewCatalogService(item: Omit<WorkerServiceCatalogItem, 'id'>): void {
    const generatedId = `srv-${Date.now()}`;
    const newService: WorkerServiceCatalogItem = {
      id: generatedId,
      ...item,
    };
    this.workerServices.update((services) => [newService, ...services]);
    this.updateRatesSyncTimestamp();
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update((open) => !open);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  setRateType(type: 'HOURLY' | 'UNIT'): void {
    this.workerRateType.set(type);
    this.clearRatesValidationError('rate_type');
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

  setWorkerBasecampAddress(address: string): void {
    const trimmed = address.trim();
    if (trimmed) {
      this.workerBasecampAddress.set(trimmed);
      this.updateLocationSyncTimestamp();
    }
  }

  resetLocationToDefault(): void {
    this.workerLat.set(-6.234129);
    this.workerLng.set(106.852901);
    this.workerMaxRadiusKm.set(5.0);
    this.workerFreeRadiusKm.set(3.0);
    this.workerExtraFeePerKm.set(3000);
    this.workerBasecampAddress.set(
      'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan'
    );
    this.clearLocationValidationError('coordinates');
    this.clearLocationValidationError('max_radius_km');
    this.clearLocationValidationError('free_radius_km');
    this.clearLocationValidationError('extra_fee_per_km');
    this.updateLocationSyncTimestamp();
  }

  clearInputValidationError(fieldName: string): void {
    const current = { ...this.inputValidationErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.inputValidationErrors.set(current);
    }
  }

  clearRatesValidationError(fieldName: string): void {
    const current = { ...this.ratesValidationErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.ratesValidationErrors.set(current);
    }
  }

  clearLocationValidationError(fieldName: string): void {
    const current = { ...this.locationValidationErrors() };
    if (current[fieldName]) {
      delete current[fieldName];
      this.locationValidationErrors.set(current);
    }
  }

  clearAllFeedbacks(): void {
    this.profileFeedbackSuccess.set(null);
    this.profileFeedbackError.set(null);
    this.ratesFeedbackSuccess.set(null);
    this.ratesFeedbackError.set(null);
    this.locationFeedbackSuccess.set(null);
    this.locationFeedbackError.set(null);
    this.scheduleFeedbackSuccess.set(null);
    this.scheduleFeedbackError.set(null);
    this.planFeedbackSuccess.set(null);
    this.boostFeedbackSuccess.set(null);
  }

  validateProfileInput(): boolean {
    const errors: Record<string, string> = {};

    if (!this.workerFullName().trim()) {
      errors['name'] = 'Nama lengkap pekerja wajib diisi.';
    }

    const wa = this.workerWhatsAppNumber().trim();
    if (wa) {
      if (!/^[0-9+\s-]+$/.test(wa)) {
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
    }

    this.inputValidationErrors.set(errors);
    return Object.keys(errors).length === 0;
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

  loadExistingWorkerProfile(slug: string, onLoaded?: () => void): void {
    const sanitizedSlug = slug.trim().toLowerCase();
    if (!sanitizedSlug) return;

    this.isProfileLoading.set(true);
    this.clearAllFeedbacks();
    this.workerLookupSlugInput.set(sanitizedSlug);

    this.apiService.fetchWorkerProfile(sanitizedSlug).subscribe({
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
            services: response.data.services,
          });
          this.loadWorkerSchedules(response.data.id || sanitizedSlug);
          if (onLoaded) {
            onLoaded();
          }
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
      services?: import('../../worker-booking/models/worker-catalog.model').PublicServiceCatalogItem[];
    }
  ): void {
    this.workerRecordId.set(id);
    this.workerSlugIdentifier.set(profile.slug);
    this.workerFullName.set(profile.name);
    this.workerProfessionZone.set(profile.zone);
    if (profile.zone && profile.zone.trim()) {
      this.workerBasecampAddress.set(`Basecamp Area ${profile.zone.trim()}`);
    }
    this.workerBioDescription.set(profile.bio || '');
    this.workerAvatarUrl.set(profile.avatar_url || '');
    this.workerWhatsAppNumber.set(profile.whatsapp_number || '');

    if (
      profile.base_price !== undefined &&
      profile.base_price !== null &&
      !Number.isNaN(profile.base_price) &&
      profile.base_price > 0
    ) {
      this.workerBasePrice.set(profile.base_price);
    } else {
      this.workerBasePrice.set(null);
    }

    const normalizedRateType =
      (profile.rate_type || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'HOURLY';
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

    if (
      profile.max_radius_km !== undefined &&
      profile.max_radius_km !== null &&
      profile.max_radius_km > 0
    ) {
      this.workerMaxRadiusKm.set(profile.max_radius_km);
    } else {
      this.workerMaxRadiusKm.set(10);
    }

    if (
      profile.free_radius_km !== undefined &&
      profile.free_radius_km !== null &&
      profile.free_radius_km >= 0
    ) {
      this.workerFreeRadiusKm.set(profile.free_radius_km);
    } else {
      this.workerFreeRadiusKm.set(3);
    }

    if (
      profile.extra_fee_per_km !== undefined &&
      profile.extra_fee_per_km !== null &&
      profile.extra_fee_per_km >= 0
    ) {
      this.workerExtraFeePerKm.set(profile.extra_fee_per_km);
    } else {
      this.workerExtraFeePerKm.set(0);
    }

    if (profile.services && profile.services.length > 0) {
      const mappedServices: WorkerServiceCatalogItem[] = profile.services.map((srv, idx) => {
        const rateType: 'HOURLY' | 'UNIT' =
          (srv.rate_type || '').toUpperCase() === 'UNIT' ? 'UNIT' : 'HOURLY';
        const price = srv.price || srv.base_price || (profile.base_price ?? 75000);
        const prefix = rateType === 'HOURLY' ? 'DCL' : 'GCL';
        const code = `${prefix}-0${idx + 1}`;
        return {
          id: srv.id || `srv-${idx + 1}`,
          code: code,
          name: srv.name,
          description: srv.description || '',
          price: price,
          base_price: price,
          rate_type: rateType,
          duration_minutes: srv.duration_minutes || 60,
          min_hours: rateType === 'HOURLY' ? 2.0 : undefined,
          max_hours: rateType === 'UNIT' ? 2.0 : undefined,
          equipment_label:
            rateType === 'HOURLY' ? 'Polisher & Vac Industri' : 'Alat Ringan Bawa Sendiri',
          equipment_badge:
            rateType === 'HOURLY'
              ? 'Alat Berat Industri Siap Pakai'
              : 'Pembersihan Cepat & Efisien',
          equipment_icon: rateType === 'HOURLY' ? 'verified' : 'flash_on',
          image_url:
            rateType === 'HOURLY'
              ? DEFAULT_WORKER_SERVICES[0].image_url
              : DEFAULT_WORKER_SERVICES[1].image_url,
          tags:
            rateType === 'HOURLY'
              ? [
                  'Bahan Kimia Ramah Lingkungan',
                  'Termasuk Mesin Polisher',
                  'Alat & Cairan Lengkap',
                ]
              : ['Alat Bawa Sendiri', 'Cocok Apartemen / Studio', 'Cepat Bersih'],
          status: 'ACTIVE',
          is_public: true,
        };
      });
      this.workerServices.set(mappedServices);
    }

    const hasCustomConfig = this.loadWhatsAppSettingsFromStorage(profile.slug);
    if (!hasCustomConfig && profile.name) {
      this.whatsappMessageTemplate.set(buildDefaultWhatsAppTemplate(profile.name));
    }
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
    this.workerBasecampAddress.set(
      'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan'
    );
    this.workerLookupSlugInput.set('');
    this.workerSchedules.set([]);
    this.workerServices.set([...DEFAULT_WORKER_SERVICES]);
    this.servicesActiveTab.set('ACTIVE');
    this.isMobileSidebarOpen.set(false);
    this.inputValidationErrors.set({});
    this.ratesValidationErrors.set({});
    this.locationValidationErrors.set({});
    this.resetWhatsAppTemplateToDefault();
    this.isEditingWhatsAppNumber.set(false);
    this.clearOtpTimer();
    this.clearAllFeedbacks();
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

    const rawNumber = this.workerWhatsAppNumber().trim();
    const sanitizedWhatsApp = rawNumber ? normalizeWhatsAppNumberForWaMe(rawNumber) : '';
    const payload: WorkerProfileUpdatePayload = {
      name: this.workerFullName().trim(),
      zone: this.workerProfessionZone().trim(),
      bio: this.workerBioDescription().trim(),
      avatar_url: this.workerAvatarUrl().trim(),
      whatsapp_number: sanitizedWhatsApp,
    };

    this.apiService.updateWorkerProfile(workerId, payload).subscribe({
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

  submitRatesUpdate(): void {
    if (!this.validateRatesInput()) {
      return;
    }

    const workerId = this.workerRecordId().trim();
    if (!workerId) {
      this.updateRatesSyncTimestamp();
      this.ratesFeedbackSuccess.set('Pengaturan katalog tarif pekerja berhasil diperbarui!');
      return;
    }

    this.isRatesSubmitting.set(true);
    this.ratesFeedbackSuccess.set(null);
    this.ratesFeedbackError.set(null);

    const payload: WorkerRateUpdatePayload = {
      base_price: Number(this.workerBasePrice()),
      rate_type: this.workerRateType(),
    };

    this.apiService.updateWorkerRates(workerId, payload).subscribe({
      next: (response) => {
        this.isRatesSubmitting.set(false);
        if (response.success) {
          this.ratesFeedbackSuccess.set(
            response.message || 'Pengaturan tarif pekerja berhasil diperbarui!'
          );
          if (response.data) {
            if (
              response.data.base_price &&
              !Number.isNaN(response.data.base_price) &&
              response.data.base_price > 0
            ) {
              this.workerBasePrice.set(response.data.base_price);
            }
            const returnedType = (response.data.rate_type || '').toUpperCase();
            if (returnedType === 'UNIT' || returnedType === 'HOURLY') {
              this.workerRateType.set(returnedType);
            }
            this.updateRatesSyncTimestamp();
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

  submitLocationSettingsUpdate(): void {
    if (!this.validateLocationSettingsInput()) {
      return;
    }

    const workerId = this.workerRecordId().trim();
    if (!workerId) {
      this.updateLocationSyncTimestamp();
      this.locationFeedbackSuccess.set(
        'Pengaturan lokasi dan radius jangkauan berhasil disimpan!'
      );
      return;
    }

    this.isLocationSubmitting.set(true);
    this.locationFeedbackSuccess.set(null);
    this.locationFeedbackError.set(null);

    const payload: WorkerLocationSettingsUpdatePayload = {
      lat: Number(this.workerLat()),
      lng: Number(this.workerLng()),
      max_radius_km: Number(this.workerMaxRadiusKm()),
      free_radius_km: Number(this.workerFreeRadiusKm()),
      extra_fee_per_km: Number(this.workerExtraFeePerKm()),
    };

    this.apiService.updateWorkerLocationSettings(workerId, payload).subscribe({
      next: (response) => {
        this.isLocationSubmitting.set(false);
        if (response.success) {
          this.updateLocationSyncTimestamp();
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

    this.apiService.fetchWorkerSchedules(sanitized).subscribe({
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

    this.apiService.updateWorkerSchedules(workerId, this.workerSchedules()).subscribe({
      next: (response) => {
        this.isScheduleSubmitting.set(false);
        if (response.success) {
          this.updateScheduleSyncTimestamp();
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

  setTransitBufferMinutes(minutes: number): void {
    this.transitBufferMinutes.set(minutes);
    this.updateScheduleSyncTimestamp();
  }

  toggleAutoPeakHourBuffer(): void {
    this.autoPeakHourBuffer.update((val) => !val);
    this.updateScheduleSyncTimestamp();
  }

  toggleMandatoryLunchBreak(): void {
    this.mandatoryLunchBreak.update((val) => !val);
    this.updateScheduleSyncTimestamp();
  }

  toggleTodayEmergencyLock(): void {
    this.isTodayEmergencyLocked.update((val) => !val);
    this.updateScheduleSyncTimestamp();
  }

  setOrderLeadTimeHours(hours: number): void {
    this.orderLeadTimeHours.set(hours);
    this.updateScheduleSyncTimestamp();
  }

  toggleAutoBlockPersonalAgenda(): void {
    this.autoBlockPersonalAgenda.update((val) => !val);
    this.updateScheduleSyncTimestamp();
  }

  setSelectedScheduleDateSegment(segment: string): void {
    this.selectedScheduleDateSegment.set(segment);
  }

  toggleSlot3Lock(): void {
    this.isSlot3Locked.update((val) => !val);
  }

  resetScheduleToDefault(): void {
    this.workerSchedules.set(this.createDefaultWeeklySchedule());
    this.transitBufferMinutes.set(90);
    this.autoPeakHourBuffer.set(true);
    this.mandatoryLunchBreak.set(true);
    this.isTodayEmergencyLocked.set(false);
    this.orderLeadTimeHours.set(3);
    this.autoBlockPersonalAgenda.set(true);
    this.selectedScheduleDateSegment.set('Besok (25 Okt)');
    this.isSlot3Locked.set(false);
    this.updateScheduleSyncTimestamp();
    this.scheduleFeedbackSuccess.set('Jadwal kerja dan aturan buffer berhasil diatur ulang ke default!');
  }

  updateScheduleSyncTimestamp(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.lastScheduleSyncTimestamp.set(`Hari ini, ${hours}:${minutes} WIB`);
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

  selectPlanTier(tier: 'STARTER' | 'PRO' | 'FLEET'): void {
    this.currentPlanTier.set(tier);
    const tierLabels: Record<'STARTER' | 'PRO' | 'FLEET', string> = {
      STARTER: 'Paket Starter (Bebas Komisi Dasar)',
      PRO: 'Paket Mandiri Pro (Prioritas Radar & Verified)',
      FLEET: 'Paket Bengkel & Tim (Studio Fleet)',
    };
    this.planFeedbackSuccess.set(`Paket berhasil diubah ke ${tierLabels[tier]}!`);
  }

  activateBoost(pkg: 'FLASH_24H' | 'WEEKEND_72H' | 'WEEKLY_7D'): void {
    this.activeBoostPackage.set(pkg);
    this.isBoostActive.set(true);
    const packageLabels: Record<'FLASH_24H' | 'WEEKEND_72H' | 'WEEKLY_7D', string> = {
      FLASH_24H: 'Boost Kilat 24 Jam',
      WEEKEND_72H: 'Boost Akhir Pekan (72 Jam)',
      WEEKLY_7D: 'Boost Mingguan (7 Hari)',
    };
    this.boostFeedbackSuccess.set(
      `Permintaan aktivasi ${packageLabels[pkg]} berhasil diaktifkan! Radar visibilitas Anda kini aktif.`
    );
  }

  toggleBoostStatus(): void {
    this.isBoostActive.update((active) => !active);
    if (!this.isBoostActive()) {
      this.boostFeedbackSuccess.set('Boost visibilitas radar dinonaktifkan sementara.');
    } else {
      this.boostFeedbackSuccess.set('Boost visibilitas radar kembali aktif.');
    }
  }

  saveAllSettings(): void {
    this.saveWhatsAppSettingsToStorage();
    if (this.workerRecordId().trim()) {
      const basePrice = this.workerBasePrice();
      if (basePrice !== null && basePrice > 0) {
        this.submitRatesUpdate();
      }
      if (this.workerLat() !== null && this.workerLng() !== null) {
        this.submitLocationSettingsUpdate();
      }
      if (this.workerFullName().trim()) {
        this.submitProfileUpdate();
      }
      if (this.workerSchedules().length > 0) {
        this.submitScheduleUpdate();
      }
    }
  }

  ngOnDestroy(): void {
    this.clearOtpTimer();
    if (this.clipboardTimeoutId) {
      clearTimeout(this.clipboardTimeoutId);
      this.clipboardTimeoutId = null;
    }
  }
}
