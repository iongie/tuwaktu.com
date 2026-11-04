import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface BasecampPresetLocation {
  readonly label: string;
  readonly address: string;
  readonly lat: number;
  readonly lng: number;
}

@Component({
  selector: 'app-worker-basecamp-map-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col gap-5 border border-hairline-subtle">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">share_location</span>
          <h2 class="font-heading-3 text-heading-3 text-primary font-semibold">
            Titik Tolak Basecamp / Pangkalan
          </h2>
        </div>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-surface text-success text-micro-uppercase font-micro-uppercase font-bold tracking-wide border border-success/20">
          <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
          <span>GPS Presisi Aktif</span>
        </span>
      </div>

      <!-- Address Card with High Contrast Telemetry -->
      <div class="bg-surface-highlight rounded-lg p-5 flex flex-col gap-4 border border-hairline-subtle">
        <div class="flex flex-col gap-1">
          <span class="text-caption font-caption text-ink-secondary uppercase tracking-wider font-semibold">
            Alamat Fisik Tersimpan
          </span>
          <span class="font-lead-body text-lead-body text-primary font-semibold">
            {{ address() }}
          </span>
          <span class="font-caption text-caption text-on-surface-variant">
            {{ zoneDetails() }}
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-hairline-subtle/60">
          <div class="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-hairline-subtle shadow-2xs">
            <span class="material-symbols-outlined text-ink-secondary text-[16px]">pin_drop</span>
            <span class="font-mono-rate text-mono-rate text-primary font-bold">
              {{ latitude() | number:'1.6-6' }}, {{ longitude() | number:'1.6-6' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="toggleEditLocation()"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-container-high transition-colors text-primary font-button-label text-button-label min-h-[44px] cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">edit_location_alt</span>
              <span>{{ isEditLocationOpen() ? 'Tutup Peta' : 'Ubah Basecamp' }}</span>
            </button>

            <a
              [href]="externalMapsUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-container-high transition-colors text-primary font-button-label text-button-label min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Buka di Peta</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Expandable Interactive Location Editor -->
      @if (isEditLocationOpen()) {
        <div class="p-5 rounded-xl bg-surface-highlight border border-hairline-subtle space-y-4 animate-fadeIn">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="font-body-strong text-body-strong text-primary font-semibold">
                Penyesuaian Titik GPS Basecamp
              </span>
              <p class="font-caption text-caption text-ink-secondary mt-0.5">
                Kunci koordinat awal untuk memastikan kalkulasi ongkir ke pelanggan tepat.
              </p>
            </div>
            <button
              type="button"
              (click)="requestDeviceGeolocation()"
              [disabled]="isLocatingDevice()"
              class="m3-btn-outlined text-xs py-2 px-3.5 min-h-[44px] flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              @if (isLocatingDevice()) {
                <span class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Mendeteksi GPS...</span>
              } @else {
                <span class="material-symbols-outlined text-[16px] text-voltage-orange">my_location</span>
                <span>Gunakan Lokasi Saya</span>
              }
            </button>
          </div>

          @if (geolocationFeedback()) {
            <div
              role="status"
              class="p-2.5 rounded-lg text-xs font-mono"
              [class.bg-error-surface]="geolocationFeedback()!.isError"
              [class.text-error-dark]="geolocationFeedback()!.isError"
              [class.border]="geolocationFeedback()!.isError"
              [class.border-error/30]="geolocationFeedback()!.isError"
              [class.bg-success-surface]="!geolocationFeedback()!.isError"
              [class.text-success]="!geolocationFeedback()!.isError"
            >
              {{ geolocationFeedback()!.message }}
            </div>
          }

          <!-- Quick Jabodetabek Presets -->
          <div class="space-y-1.5">
            <span class="font-caption text-caption text-ink-secondary font-semibold">
              Pilihan Cepat Area Pangkalan:
            </span>
            <div class="flex flex-wrap gap-1.5">
              @for (preset of presets; track preset.label) {
                <button
                  type="button"
                  (click)="applyPresetCoordinate(preset)"
                  class="m3-chip text-[11px] py-1 px-3 min-h-[36px] cursor-pointer"
                  [class.m3-chip-active]="isPresetActive(preset)"
                >
                  {{ preset.label }}
                </button>
              }
            </div>
          </div>

          <!-- Manual Inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="basecamp-lat-input" class="block text-[11px] font-mono text-ink-secondary mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                id="basecamp-lat-input"
                type="number"
                step="0.0000001"
                [ngModel]="latitude()"
                (ngModelChange)="onManualLatChange($event)"
                class="m3-field-outlined font-mono-rate text-xs h-10 w-full"
                placeholder="-6.234129"
              />
            </div>
            <div>
              <label for="basecamp-lng-input" class="block text-[11px] font-mono text-ink-secondary mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                id="basecamp-lng-input"
                type="number"
                step="0.0000001"
                [ngModel]="longitude()"
                (ngModelChange)="onManualLngChange($event)"
                class="m3-field-outlined font-mono-rate text-xs h-10 w-full"
                placeholder="106.852901"
              />
            </div>
          </div>

          <!-- OpenStreetMap Embed Viewer -->
          @if (sanitizedMapEmbedUrl(); as mapUrl) {
            <div class="rounded-xl overflow-hidden border border-hairline-subtle bg-surface-container h-44 relative">
              <iframe
                [src]="mapUrl"
                title="Peta Interaktif Basecamp"
                class="w-full h-full border-0"
                loading="lazy"
              ></iframe>
            </div>
          }
        </div>
      }

      <!-- Visual Location Canvas (Dark Aerial Vector Aesthetic from Stitch) -->
      <div
        class="relative w-full h-52 rounded-xl overflow-hidden shadow-inner bg-hero-canvas flex flex-col justify-between p-4 border border-white/10"
      >
        <!-- Dark grid pattern background & radar gradient -->
        <div class="absolute inset-0 bg-[radial-gradient(#303030_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-hero-canvas/95 via-hero-canvas/40 to-transparent pointer-events-none"></div>

        <!-- Radar Ring Circles Overlay -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <!-- Max Radius Circle (Red/Orange dashed) -->
          <div class="w-40 h-40 rounded-full border border-dashed border-voltage-orange/30 animate-pulse"></div>
          <!-- Free Radius Circle (Green solid) -->
          <div class="w-24 h-24 rounded-full border border-emerald-500/40 bg-emerald-500/5"></div>
        </div>

        <!-- Canvas Top Telemetry -->
        <div class="relative z-10 flex justify-between items-start">
          <span class="px-2.5 py-1 rounded bg-hero-canvas/85 backdrop-blur-md text-ink-on-dark font-mono-rate text-caption border border-white/10">
            ZOOM: 1:12000 • SEKTOR {{ zone().toUpperCase() }}
          </span>
          <div class="w-8 h-8 rounded-full bg-hero-canvas/90 text-voltage-orange flex items-center justify-center shadow-md border border-white/10">
            <span class="material-symbols-outlined text-[18px]">navigation</span>
          </div>
        </div>

        <!-- Canvas Center Basecamp Marker -->
        <div class="relative z-10 flex flex-col items-center justify-center pointer-events-none">
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-voltage-orange opacity-40 animate-ping"></span>
            <span class="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-voltage-orange text-white shadow-lg">
              <span class="material-symbols-outlined text-[16px]">location_on</span>
            </span>
          </div>
        </div>

        <!-- Canvas Bottom Status -->
        <div class="relative z-10 flex items-center justify-between text-ink-on-dark text-caption font-mono-rate">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-voltage-orange animate-pulse"></span>
            <span class="font-body-strong text-body-strong text-white font-semibold">
              Titik Nol Pangkalan Aktif
            </span>
          </div>
          <span class="text-neutral-400">
            Akurasi GPS ± 3 meter
          </span>
        </div>
      </div>
    </div>
  `,
})
export class WorkerBasecampMapPanelComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);

  readonly latitude = input<number | null>(-6.234129);
  readonly longitude = input<number | null>(106.852901);
  readonly freeRadiusKm = input<number>(3.0);
  readonly maxRadiusKm = input<number>(5.0);
  readonly address = input<string>(
    'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan'
  );
  readonly zone = input<string>('Jakarta Selatan');

  readonly coordinatesChange = output<{ lat: number; lng: number }>();
  readonly addressChange = output<string>();

  readonly isEditLocationOpen = signal<boolean>(false);
  readonly isLocatingDevice = signal<boolean>(false);
  readonly geolocationFeedback = signal<{ message: string; isError: boolean } | null>(null);

  readonly presets: readonly BasecampPresetLocation[] = [
    {
      label: 'Tebet (Basecamp Utama)',
      address: 'Jl. Tebet Timur Dalam Raya No. 18, Tebet, Jakarta Selatan',
      lat: -6.234129,
      lng: 106.852901,
    },
    {
      label: 'Blok M (Jaksel)',
      address: 'Jl. Melawai Raya, Kebayoran Baru, Jakarta Selatan',
      lat: -6.2443,
      lng: 106.7997,
    },
    {
      label: 'Monas (Jakpus)',
      address: 'Gambir, Jakarta Pusat',
      lat: -6.1754,
      lng: 106.8272,
    },
    {
      label: 'Kuningan (Karet)',
      address: 'Jl. Prof. DR. Satrio, Setiabudi, Jakarta Selatan',
      lat: -6.2241,
      lng: 106.8291,
    },
    {
      label: 'Bintaro (Tangsel)',
      address: 'Bintaro Jaya Sektor 3A, Tangerang Selatan',
      lat: -6.2838,
      lng: 106.7115,
    },
    {
      label: 'Margonda (Depok)',
      address: 'Jl. Margonda Raya No. 100, Depok',
      lat: -6.3728,
      lng: 106.8327,
    },
  ];

  readonly zoneDetails = computed(() => {
    return 'DKI Jakarta • Akses parkir roda dua aman & perlengkapan siap jalan';
  });

  readonly externalMapsUrl = computed(() => {
    const lat = this.latitude() ?? -6.234129;
    const lng = this.longitude() ?? 106.852901;
    return `https://maps.google.com/?q=${lat},${lng}`;
  });

  readonly sanitizedMapEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return null;
    }
    const delta = 0.025;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  toggleEditLocation(): void {
    this.isEditLocationOpen.update((open) => !open);
  }

  isPresetActive(preset: BasecampPresetLocation): boolean {
    const currentLat = this.latitude();
    const currentLng = this.longitude();
    if (currentLat === null || currentLng === null) return false;
    return (
      Math.abs(currentLat - preset.lat) < 0.0005 &&
      Math.abs(currentLng - preset.lng) < 0.0005
    );
  }

  applyPresetCoordinate(preset: BasecampPresetLocation): void {
    this.coordinatesChange.emit({ lat: preset.lat, lng: preset.lng });
    this.addressChange.emit(preset.address);
    this.geolocationFeedback.set({
      message: `Titik basecamp dialihkan ke ${preset.label}.`,
      isError: false,
    });
  }

  onManualLatChange(rawVal: unknown): void {
    const lat = Number(rawVal);
    const lng = this.longitude() ?? 106.852901;
    if (!Number.isNaN(lat)) {
      this.coordinatesChange.emit({ lat, lng });
    }
  }

  onManualLngChange(rawVal: unknown): void {
    const lng = Number(rawVal);
    const lat = this.latitude() ?? -6.234129;
    if (!Number.isNaN(lng)) {
      this.coordinatesChange.emit({ lat, lng });
    }
  }

  requestDeviceGeolocation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!('geolocation' in navigator)) {
      this.geolocationFeedback.set({
        message: 'Perangkat tidak mendukung geolokasi GPS.',
        isError: true,
      });
      return;
    }

    this.isLocatingDevice.set(true);
    this.geolocationFeedback.set(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.isLocatingDevice.set(false);
        const lat = Math.round(pos.coords.latitude * 1e7) / 1e7;
        const lng = Math.round(pos.coords.longitude * 1e7) / 1e7;
        this.coordinatesChange.emit({ lat, lng });
        this.geolocationFeedback.set({
          message: 'Lokasi GPS perangkat berhasil terkunci!',
          isError: false,
        });
      },
      () => {
        this.isLocatingDevice.set(false);
        this.geolocationFeedback.set({
          message: 'Izin akses lokasi GPS ditolak oleh peramban.',
          isError: true,
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
}
