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
import { WorkerDashboardApiService } from '../../services/worker-dashboard-api.service';
import { WorkerProfileUpdatePayload } from '../../models/worker-profile.model';

@Component({
  selector: 'app-worker-dashboard-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './worker-dashboard-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardProfileComponent implements OnInit {
  private readonly dashboardApiService = inject(WorkerDashboardApiService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly workerRecordId = signal<string>('');
  readonly workerSlugIdentifier = signal<string>('');
  readonly workerFullName = signal<string>('');
  readonly workerProfessionZone = signal<string>('');
  readonly workerBioDescription = signal<string>('');
  readonly workerAvatarUrl = signal<string>('');

  readonly workerLookupSlugInput = signal<string>('');
  readonly suggestedWorkerSlugs: readonly string[] = ['budi-santoso', 'siti-aminah'];

  readonly isProfileSubmitting = signal<boolean>(false);
  readonly isProfileLoading = signal<boolean>(false);
  readonly profileFeedbackSuccess = signal<string | null>(null);
  readonly profileFeedbackError = signal<string | null>(null);
  readonly clipboardFeedbackMessage = signal<string | null>(null);
  readonly inputValidationErrors = signal<Record<string, string>>({});

  private clipboardTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
    this.profileFeedbackSuccess.set(null);
    this.profileFeedbackError.set(null);
    this.router.navigate([], { queryParams: { slug: null }, queryParamsHandling: 'merge' });
  }

  loadExistingWorkerProfile(slug: string): void {
    const sanitizedSlug = slug.trim().toLowerCase();
    this.isProfileLoading.set(true);
    this.profileFeedbackError.set(null);
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
            });
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
    }
  ): void {
    this.workerRecordId.set(id);
    this.workerSlugIdentifier.set(profile.slug);
    this.workerFullName.set(profile.name);
    this.workerProfessionZone.set(profile.zone);
    this.workerBioDescription.set(profile.bio || '');
    this.workerAvatarUrl.set(profile.avatar_url || '');
  }

  validateProfileInput(): boolean {
    const errors: Record<string, string> = {};

    if (!this.workerFullName().trim()) {
      errors['name'] = 'Nama lengkap pekerja wajib diisi.';
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

    const payload: WorkerProfileUpdatePayload = {
      name: this.workerFullName().trim(),
      zone: this.workerProfessionZone().trim(),
      bio: this.workerBioDescription().trim(),
      avatar_url: this.workerAvatarUrl().trim(),
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
            }
          }
        },
        error: () => {
          this.isProfileSubmitting.set(false);
          this.profileFeedbackError.set(
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
}
