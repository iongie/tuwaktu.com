import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { compressImageToTargetSize } from '../../../../../core/utils/image-compression.util';
import { resolveAvatarUrl } from '../../../../../core/utils/avatar-url.util';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

@Component({
  selector: 'app-avatar-upload-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-(--hairline-light) bg-(--surface-container-low)">
      <!-- Avatar Preview Ring -->
      <div class="relative shrink-0 group">
        <div
          class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white shadow-xs bg-(--surface-container) flex items-center justify-center text-(--brand-ink) font-bold text-lg select-none"
        >
          @if (displayAvatarUrl()) {
            <img
              [src]="displayAvatarUrl()"
              [alt]="workerName() || 'Foto Profil Mitra'"
              class="w-full h-full object-cover"
              (error)="onImageError()"
            />
          } @else {
            <span class="font-mono text-xl text-(--brand-ink)/60 tracking-wider">
              {{ initials() }}
            </span>
          }
        </div>

        @if (isProcessing()) {
          <div
            class="absolute inset-0 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white"
            aria-live="polite"
          >
            <span class="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
        }
      </div>

      <!-- Action & Information Column -->
      <div class="flex flex-col flex-1 min-w-0 space-y-2">
        <div class="flex flex-col">
          <span class="text-xs font-bold tracking-wide uppercase text-(--brand-ink)">
            Foto Profil Mitra
          </span>
          <p class="text-xs text-(--brand-ink)/60 mt-0.5">
            Format JPG, PNG, atau WebP. Otomatis dikompresi di bawah 100 KB agar hemat kuota dan cepat diakses pelanggan.
          </p>
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            class="hidden"
            (change)="onFileSelected($event)"
          />

          <button
            type="button"
            [disabled]="isProcessing()"
            (click)="triggerFileInput()"
            class="m3-btn-outlined text-xs min-h-[44px] px-4 flex items-center gap-2 cursor-pointer hover:bg-white"
          >
            <span class="material-symbols-outlined text-[18px]">add_a_photo</span>
            <span>{{ displayAvatarUrl() ? 'Ganti Foto' : 'Pilih Foto Profil' }}</span>
          </button>

          @if (displayAvatarUrl() && !isProcessing()) {
            <button
              type="button"
              (click)="removeAvatar()"
              class="m3-btn-outlined text-xs min-h-[44px] px-3 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 cursor-pointer"
              title="Hapus foto profil"
            >
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          }
        </div>

        <!-- Feedback & Status Badges -->
        @if (statusMessage()) {
          <div class="flex items-center gap-1.5 text-xs text-emerald-700 font-medium pt-0.5">
            <span class="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
            <span>{{ statusMessage() }}</span>
          </div>
        }

        @if (errorMessage()) {
          <div class="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-0.5">
            <span class="material-symbols-outlined text-sm text-red-500">error</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class AvatarUploadPickerComponent {
  private readonly apiService = inject(WorkerDashboardApiService);

  readonly workerId = input<string>('');
  readonly workerName = input<string>('');
  readonly currentAvatarUrl = input<string>('');

  readonly avatarUrlChange = output<string>();

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  readonly localPreviewUrl = signal<string | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Compute displayed avatar: local preview takes priority during upload/compression
  get displayAvatarUrl(): () => string {
    return () => {
      const preview = this.localPreviewUrl();
      if (preview) {
        return preview;
      }
      return resolveAvatarUrl(this.currentAvatarUrl().trim());
    };
  }

  get initials(): () => string {
    return () => {
      const name = this.workerName().trim();
      if (!name) {
        return 'TW';
      }
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
  }

  triggerFileInput(): void {
    this.errorMessage.set(null);
    this.statusMessage.set(null);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
      this.fileInput.nativeElement.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const files = inputEl.files;
    if (!files || files.length === 0) {
      return;
    }

    const rawFile = files[0];
    this.errorMessage.set(null);
    this.statusMessage.set(null);

    // 1. Instant local preview within 1 millisecond
    const quickLocalUrl = URL.createObjectURL(rawFile);
    this.localPreviewUrl.set(quickLocalUrl);

    // 2. Start non-blocking compression and background upload
    this.isProcessing.set(true);
    this.statusMessage.set('Mengompresi foto...');

    try {
      const compressionResult = await compressImageToTargetSize(rawFile, {
        maxDimension: 600,
        maxSizeBytes: 100 * 1024,
      });

      // Update preview to compressed high-fidelity data URL
      this.localPreviewUrl.set(compressionResult.dataUrl);
      this.statusMessage.set(
        `Ukuran berkas ${compressionResult.sizeFormatted} (WebP) - Mengunggah ke server...`
      );

      const targetWorkerId = this.workerId().trim();
      if (!targetWorkerId) {
        // If worker ID is not yet available, pass data URL to form and mark ready
        this.isProcessing.set(false);
        this.statusMessage.set(
          `Foto terkompresi ${compressionResult.sizeFormatted} - Siap disimpan bersama data profil.`
        );
        return;
      }

      // Background upload to backend
      this.apiService.uploadAvatar(targetWorkerId, compressionResult.file).subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          if (response.success && response.data?.avatar_url) {
            this.statusMessage.set(
              `Foto profil berhasil diperbarui (${compressionResult.sizeFormatted})`
            );
            this.localPreviewUrl.set(null);
            this.avatarUrlChange.emit(response.data.avatar_url);
          } else {
            this.errorMessage.set(
              response.message || 'Gagal menyimpan foto profil di server'
            );
          }
        },
        error: (err) => {
          this.isProcessing.set(false);
          const serverMsg = err?.error?.message;
          this.errorMessage.set(
            serverMsg || 'Koneksi gagal saat mengunggah foto profil'
          );
        },
      });
    } catch (err) {
      this.isProcessing.set(false);
      const msg = err instanceof Error ? err.message : 'Gagal memproses berkas gambar';
      this.errorMessage.set(msg);
    }
  }

  removeAvatar(): void {
    this.localPreviewUrl.set(null);
    this.statusMessage.set(null);
    this.errorMessage.set(null);
    this.avatarUrlChange.emit('');
  }

  onImageError(): void {
    // If the image fails to load, gracefully reset local preview
    this.localPreviewUrl.set(null);
  }
}

