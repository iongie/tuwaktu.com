import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { AvatarUploadPickerComponent } from '../../molecules/avatar-upload-picker/avatar-upload-picker.component';

@Component({
  selector: 'app-worker-dashboard-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarUploadPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Sovereign Profile Header Banner -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div class="space-y-2 max-w-2xl">
          <div
            class="flex items-center gap-2 text-micro-uppercase font-micro-uppercase text-secondary tracking-widest uppercase"
          >
            <span class="inline-block w-2 h-2 rounded-full bg-secondary"></span>
            <span>Identitas Mandiri &bull; Akses Publik Langsung</span>
          </div>
          <h1
            class="font-heading-1 text-heading-1 text-on-surface tracking-tight font-bold"
          >
            Profil &amp; Identitas Mitra
          </h1>
          <p
            class="font-body-default text-body-default text-ink-secondary leading-relaxed"
          >
            Kelola nama profesional, foto profil berukuran ringan (&lt; 100 KB), spesialisasi, dan biografi Anda untuk menarik kepercayaan pelanggan di halaman publik.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <a
            [href]="store.publicProfileRelativeUrl() || '/'"
            target="_blank"
            class="h-11 px-5 rounded-lg bg-surface-container-high text-on-surface font-button-label text-button-label hover:bg-surface-variant transition-colors flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
          >
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Lihat Halaman Publik</span>
          </a>
        </div>
      </div>

      <!-- Main Profile Form Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Avatar & Primary Identity Panel (7 Cols) -->
        <div class="lg:col-span-7 space-y-6">
          <section
            class="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-5 border border-hairline-subtle"
          >
            <div class="flex items-center justify-between pb-3 border-b border-hairline-subtle">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"
                >
                  <span class="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div>
                  <h2 class="font-heading-3 text-heading-3 text-ink-on-light">Foto &amp; Data Pribadi</h2>
                  <span class="font-caption text-caption text-ink-secondary">
                    Ditampilkan pada kartu pekerja dan hasil pencarian
                  </span>
                </div>
              </div>
            </div>

            <!-- Avatar Upload Molecule -->
            <app-avatar-upload-picker
              [workerId]="store.workerRecordId()"
              [workerName]="store.workerFullName()"
              [currentAvatarUrl]="store.workerAvatarUrl()"
              (avatarUrlChange)="onAvatarChanged($event)"
            />

            <!-- Form Inputs -->
            <form (ngSubmit)="submitProfileForm()" class="space-y-4 pt-2">
              <!-- Nama Lengkap -->
              <div class="space-y-1.5">
                <label
                  for="profileFullNameInput"
                  class="block text-xs font-bold tracking-wide uppercase text-on-surface"
                >
                  Nama Lengkap / Nama Profesional
                </label>
                <input
                  id="profileFullNameInput"
                  type="text"
                  [ngModel]="store.workerFullName()"
                  (ngModelChange)="store.workerFullName.set($event)"
                  name="workerFullName"
                  placeholder="Contoh: Sarah Melinda"
                  maxlength="100"
                  required
                  class="w-full px-4 py-2.5 rounded-lg border border-hairline-subtle bg-surface-highlight text-on-surface text-sm focus:outline-hidden focus:border-primary focus:bg-white transition-colors"
                />
              </div>

              <!-- Alamat Email (Opsional) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label
                    for="profileEmailInput"
                    class="block text-xs font-bold tracking-wide uppercase text-on-surface"
                  >
                    Alamat Email (Opsional)
                  </label>
                  <span class="text-[11px] text-ink-secondary">Identitas masuk alternatif</span>
                </div>
                <input
                  id="profileEmailInput"
                  type="email"
                  [ngModel]="store.workerEmail()"
                  (ngModelChange)="store.workerEmail.set($event)"
                  name="workerEmail"
                  placeholder="Contoh: sarah@email.com"
                  maxlength="100"
                  class="w-full px-4 py-2.5 rounded-lg border border-hairline-subtle bg-surface-highlight text-on-surface text-sm focus:outline-hidden focus:border-primary focus:bg-white transition-colors"
                />
              </div>

              <!-- Spesialisasi / Profesi & Wilayah -->
              <div class="space-y-1.5">
                <label
                  for="profileZoneInput"
                  class="block text-xs font-bold tracking-wide uppercase text-on-surface"
                >
                  Keahlian &amp; Wilayah Basecamp
                </label>
                <input
                  id="profileZoneInput"
                  type="text"
                  [ngModel]="store.workerProfessionZone()"
                  (ngModelChange)="store.workerProfessionZone.set($event)"
                  name="workerProfessionZone"
                  placeholder="Contoh: Spesialis Kebersihan Hunian &bull; Bintaro"
                  maxlength="100"
                  required
                  class="w-full px-4 py-2.5 rounded-lg border border-hairline-subtle bg-surface-highlight text-on-surface text-sm focus:outline-hidden focus:border-primary focus:bg-white transition-colors"
                />
              </div>

              <!-- Biografi & Deskripsi Layanan -->
              <div class="space-y-1.5">
                <label
                  for="profileBioInput"
                  class="block text-xs font-bold tracking-wide uppercase text-on-surface"
                >
                  Deskripsi Bio Profil
                </label>
                <textarea
                  id="profileBioInput"
                  rows="4"
                  [ngModel]="store.workerBioDescription()"
                  (ngModelChange)="store.workerBioDescription.set($event)"
                  name="workerBioDescription"
                  placeholder="Ceritakan pengalaman, keahlian khusus, dan standar profesionalisme layanan Anda..."
                  maxlength="500"
                  class="w-full px-4 py-2.5 rounded-lg border border-hairline-subtle bg-surface-highlight text-on-surface text-sm focus:outline-hidden focus:border-primary focus:bg-white transition-colors resize-none"
                ></textarea>
                <span class="text-[11px] text-ink-secondary block text-right">
                  Maksimal 500 karakter
                </span>
              </div>

              <!-- Submit Action Button -->
              <div class="pt-4 border-t border-hairline-subtle flex items-center justify-end">
                <button
                  type="submit"
                  [disabled]="store.isProfileSubmitting()"
                  class="h-11 px-6 rounded-lg bg-primary text-on-primary font-button-label text-button-label hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
                >
                  @if (store.isProfileSubmitting()) {
                    <span class="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>Menyimpan Profil...</span>
                  } @else {
                    <span class="material-symbols-outlined text-[18px]">save</span>
                    <span>Simpan Perubahan Profil</span>
                  }
                </button>
              </div>
            </form>
          </section>
        </div>

        <!-- Right: Public Card Preview & Quick Tips (5 Cols) -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Live Preview Card -->
          <section
            class="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-hairline-subtle flex flex-col gap-4"
          >
            <div class="flex items-center gap-2 pb-2 border-b border-hairline-subtle">
              <span class="material-symbols-outlined text-sm text-secondary">visibility</span>
              <h3 class="font-heading-3 text-sm text-on-surface font-bold uppercase tracking-wider">
                Pratinjau Kartu Publik
              </h3>
            </div>

            <div class="p-5 rounded-xl bg-surface-highlight/70 border border-hairline-subtle flex flex-col items-center text-center gap-3">
              <div
                class="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-xs bg-surface-container flex items-center justify-center font-bold text-lg text-on-surface select-none"
              >
                @if (store.workerAvatarUrl()) {
                  <img
                    [src]="store.workerAvatarUrl()"
                    [alt]="store.workerFullName()"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <span class="font-mono text-xl text-ink-secondary">
                    {{ (store.workerFullName() || 'TW').substring(0, 2).toUpperCase() }}
                  </span>
                }
              </div>

              <div class="flex flex-col">
                <span class="font-heading-2 text-base font-bold text-on-surface">
                  {{ store.workerFullName() || 'Nama Mitra' }}
                </span>
                <span class="text-xs text-secondary font-medium">
                  {{ store.workerProfessionZone() || 'Spesialis Mandiri' }}
                </span>
              </div>

              <p class="text-xs text-on-surface-variant line-clamp-3 leading-relaxed max-w-sm">
                {{ store.workerBioDescription() || 'Belum ada deskripsi profil. Isi bio untuk menarik kepercayaan calon pemesan.' }}
              </p>
            </div>
          </section>

          <!-- Tips Section -->
          <div class="p-5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-2">
            <div class="flex items-center gap-2 font-bold text-amber-950">
              <span class="material-symbols-outlined text-base text-amber-700">lightbulb</span>
              <span>Tips Foto &amp; Profil Menarik</span>
            </div>
            <ul class="space-y-1.5 list-disc list-inside text-amber-800">
              <li>Gunakan foto wajah jelas dengan pencahayaan terang dan seragam kerja jika ada.</li>
              <li>Sistem secara otomatis mengompresi gambar ke WebP di bawah 100 KB agar hemat kuota.</li>
              <li>Perubahan profil langsung tersinkronisasi ke katalog pencarian publik pelanggan.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WorkerDashboardProfilePageComponent {
  readonly store = inject(WorkerDashboardStore);

  onAvatarChanged(newAvatarUrl: string): void {
    this.store.workerAvatarUrl.set(newAvatarUrl);
    // Simpan otomatis ke backend via store jika sudah ada record
    if (this.store.workerRecordId().trim()) {
      this.store.submitProfileUpdate();
    }
  }

  submitProfileForm(): void {
    this.store.submitProfileUpdate();
  }
}

