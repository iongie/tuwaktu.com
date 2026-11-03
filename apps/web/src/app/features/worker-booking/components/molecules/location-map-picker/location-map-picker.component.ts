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

export interface GeoCoordinatePreset {
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
}

@Component({
  selector: 'app-location-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3.5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <span class="block text-xs font-mono font-semibold text-[#141413]">
            {{ label() }}
          </span>
          <p class="text-[11px] text-[#4E4642] mt-0.5">
            {{ helperText() }}
          </p>
        </div>
        <button
          type="button"
          (click)="requestDeviceGeolocation()"
          [disabled]="isLocatingDevice()"
          class="m3-btn-outlined text-xs py-1.5 px-3 min-h-[44px] self-start sm:self-auto gap-1.5"
          aria-label="Gunakan lokasi GPS perangkat saat ini"
        >
          @if (isLocatingDevice()) {
            <span class="inline-block w-3.5 h-3.5 border-2 border-[#C84B31] border-t-transparent rounded-full animate-spin"></span>
            <span>Mencari GPS...</span>
          } @else {
            <svg class="w-3.5 h-3.5 text-[#C84B31]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            <span>Gunakan Lokasi Saya</span>
          }
        </button>
      </div>

      @if (geolocationFeedback()) {
        <div
          role="status"
          class="p-2.5 rounded-lg text-xs font-mono"
          [class.bg-[#FFDAD6]]="geolocationFeedback()!.isError"
          [class.text-[#410002]]="geolocationFeedback()!.isError"
          [class.border]="geolocationFeedback()!.isError"
          [class.border-[#BA1A1A]]="geolocationFeedback()!.isError"
          [class.bg-[#CBECE0]]="!geolocationFeedback()!.isError"
          [class.text-[#002116]]="!geolocationFeedback()!.isError"
        >
          {{ geolocationFeedback()!.message }}
        </div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="manualLatitudeInput" class="block text-[11px] font-mono text-[#4E4642] mb-1">
            Latitude (Garis Lintang)
          </label>
          <input
            id="manualLatitudeInput"
            type="number"
            step="0.0000001"
            [ngModel]="latitude()"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onLatitudeInputChanged($event)"
            placeholder="-6.2088000"
            class="m3-field-outlined font-mono text-xs"
          />
        </div>
        <div>
          <label for="manualLongitudeInput" class="block text-[11px] font-mono text-[#4E4642] mb-1">
            Longitude (Garis Bujur)
          </label>
          <input
            id="manualLongitudeInput"
            type="number"
            step="0.0000001"
            [ngModel]="longitude()"
            [ngModelOptions]="{standalone: true}"
            (ngModelChange)="onLongitudeInputChanged($event)"
            placeholder="106.8456000"
            class="m3-field-outlined font-mono text-xs"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <span class="block text-[11px] font-mono text-[#4E4642]">
          Pilihan Cepat Area Populer:
        </span>
        <div class="flex flex-wrap gap-1.5">
          @for (preset of jabodetabekPresets; track preset.label) {
            <button
              type="button"
              (click)="applyPresetCoordinate(preset)"
              class="m3-chip text-[11px] py-1 px-2.5 min-h-[36px]"
              [class.m3-chip-active]="isPresetActive(preset)"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      </div>

      <div class="rounded-xl overflow-hidden border border-[#D2C4BE] bg-[#F0EDE7]">
        @if (sanitizedMapEmbedUrl(); as mapUrl) {
          <div class="relative w-full h-48 bg-[#EAE6DF]">
            <iframe
              [src]="mapUrl"
              title="Pratinjau Peta OpenStreetMap"
              class="w-full h-full border-0 pointer-events-auto"
              loading="lazy"
              tabindex="-1"
            ></iframe>
          </div>
          <div class="p-2.5 bg-[#FDFCFB] border-t border-[#D2C4BE] flex items-center justify-between text-[11px] font-mono text-[#4E4642]">
            <div class="flex items-center gap-1.5 truncate">
              <span class="inline-block w-2 h-2 rounded-full bg-[#C84B31]"></span>
              <span class="truncate">
                Titik: {{ latitude() | number:'1.4-6' }}, {{ longitude() | number:'1.4-6' }}
              </span>
              @if (radiusKm(); as radius) {
                <span class="text-[#1E4D3B] font-semibold">
                  (Maks. {{ radius }} km)
                </span>
              }
            </div>
            <a
              [href]="openStreetMapDirectUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[#C84B31] hover:underline font-semibold flex-shrink-0"
            >
              Buka Peta &rarr;
            </a>
          </div>
        } @else {
          <div class="h-32 flex flex-col items-center justify-center p-4 text-center text-[#4E4642] font-mono text-xs space-y-1">
            <svg class="w-6 h-6 text-[#7A716C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Koordinat belum ditentukan. Klik "Gunakan Lokasi Saya" atau pilih area di atas.</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class LocationMapPickerComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);

  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);
  readonly radiusKm = input<number | null>(null);
  readonly label = input<string>('Pilih Titik Lokasi Peta');
  readonly helperText = input<string>(
    'Tentukan titik koordinat untuk memastikan kalkulasi jarak dan jangkauan akurat.'
  );

  readonly coordinatesChange = output<{ lat: number; lng: number }>();

  readonly isLocatingDevice = signal<boolean>(false);
  readonly geolocationFeedback = signal<{ message: string; isError: boolean } | null>(null);

  readonly jabodetabekPresets: readonly GeoCoordinatePreset[] = [
    { label: 'Jaksel (Blok M)', lat: -6.2443, lng: 106.7997 },
    { label: 'Jakpus (Monas)', lat: -6.1754, lng: 106.8272 },
    { label: 'Jakbar (Kebon Jeruk)', lat: -6.1915, lng: 106.7667 },
    { label: 'Jaktim (Rawamangun)', lat: -6.1966, lng: 106.8856 },
    { label: 'Jakut (Kelapa Gading)', lat: -6.1583, lng: 106.9066 },
    { label: 'Tangsel (BSD)', lat: -6.3016, lng: 106.6534 },
    { label: 'Depok (Margonda)', lat: -6.3728, lng: 106.8327 },
    { label: 'Bekasi (Summarecon)', lat: -6.2255, lng: 106.9995 },
  ];

  readonly sanitizedMapEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return null;
    }
    const delta = 0.035;
    const minLon = (lng - delta).toFixed(5);
    const minLat = (lat - delta).toFixed(5);
    const maxLon = (lng + delta).toFixed(5);
    const maxLat = (lat + delta).toFixed(5);
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  });

  readonly openStreetMapDirectUrl = computed<string>(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return 'https://www.openstreetmap.org';
    }
    return `https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lng.toFixed(5)}#map=14/${lat.toFixed(5)}/${lng.toFixed(5)}`;
  });

  isPresetActive(preset: GeoCoordinatePreset): boolean {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lng === null) return false;
    return Math.abs(lat - preset.lat) < 0.005 && Math.abs(lng - preset.lng) < 0.005;
  }

  applyPresetCoordinate(preset: GeoCoordinatePreset): void {
    this.geolocationFeedback.set({
      message: `Area ${preset.label} dipilih.`,
      isError: false,
    });
    this.coordinatesChange.emit({ lat: preset.lat, lng: preset.lng });
  }

  onLatitudeInputChanged(rawVal: unknown): void {
    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      return;
    }
    const num = Number(rawVal);
    if (!Number.isNaN(num) && num >= -90 && num <= 90) {
      const currentLng = this.longitude() ?? 106.8272;
      this.coordinatesChange.emit({ lat: num, lng: currentLng });
    }
  }

  onLongitudeInputChanged(rawVal: unknown): void {
    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      return;
    }
    const num = Number(rawVal);
    if (!Number.isNaN(num) && num >= -180 && num <= 180) {
      const currentLat = this.latitude() ?? -6.1754;
      this.coordinatesChange.emit({ lat: currentLat, lng: num });
    }
  }

  requestDeviceGeolocation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!('geolocation' in navigator)) {
      this.geolocationFeedback.set({
        message: 'Perangkat atau browser tidak mendukung fitur Geolocation.',
        isError: true,
      });
      return;
    }

    this.isLocatingDevice.set(true);
    this.geolocationFeedback.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isLocatingDevice.set(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        this.geolocationFeedback.set({
          message: 'Titik koordinat GPS berhasil diperoleh.',
          isError: false,
        });
        this.coordinatesChange.emit({ lat, lng });
      },
      (error) => {
        this.isLocatingDevice.set(false);
        let errorMsg = 'Gagal mengakses GPS. Pastikan izin lokasi aktif.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Akses lokasi ditolak. Silakan pilih dari daftar area atau ketik koordinat.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Waktu permintaan lokasi habis. Coba pilih preset area.';
        }
        this.geolocationFeedback.set({
          message: errorMsg,
          isError: true,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }
}
