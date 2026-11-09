import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import {
  AdminApproveResetResponse,
  AdminResetApprovalView,
} from '../../../../auth/models/auth.models';

@Component({
  selector: 'app-admin-credential-reset-approval-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex flex-col gap-6 max-w-3xl mx-auto w-full py-4">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-1.5">
        <nav class="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <a routerLink="/admin/workers" class="hover:text-on-surface transition-colors">Kelola Mitra</a>
          <span>/</span>
          <span class="text-on-surface font-semibold">Persetujuan Reset Kredensial</span>
        </nav>
        <div class="flex items-center gap-2.5 mt-1">
          <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[24px]">admin_panel_settings</span>
          </div>
          <div>
            <h1 class="font-heading-h2 text-heading-h2 font-bold text-on-surface">
              Persetujuan Reset Kredensial Mitra
            </h1>
            <p class="font-body-default text-caption text-on-surface-variant">
              Verifikasi keabsahan identitas sebelum menerbitkan tautan eksekusi pembaruan PIN atau WhatsApp mitra.
            </p>
          </div>
        </div>
      </div>

      <!-- State: Loading -->
      @if (loading()) {
        <div class="p-8 bg-surface border border-outline-variant/60 rounded-2xl flex flex-col items-center justify-center gap-3">
          <span class="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></span>
          <span class="text-sm font-medium text-on-surface-variant">Memverifikasi keabsahan tautan permohonan...</span>
        </div>
      }

      <!-- State: Error -->
      @if (error()) {
        <div class="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-4 text-red-950">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-red-600 text-[26px] shrink-0 mt-0.5">error</span>
            <div class="flex flex-col gap-1">
              <h3 class="font-heading-h3 text-base font-bold">Permohonan Tidak Dapat Diverifikasi</h3>
              <p class="text-sm text-red-800 leading-relaxed">{{ error() }}</p>
            </div>
          </div>
          <div class="pt-2">
            <a
              routerLink="/admin/workers"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-outline text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Kembali ke Panel Pengelola Mitra</span>
            </a>
          </div>
        </div>
      }

      <!-- State: Detail Permohonan & Konfirmasi -->
      @if (!loading() && !error() && approvalView() && !approveSuccess()) {
        <div class="p-6 bg-surface border border-outline-variant/60 rounded-2xl shadow-xs flex flex-col gap-6">
          <!-- Status Banner -->
          <div class="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-950 text-sm">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-700 text-[20px]">hourglass_top</span>
              <span class="font-semibold">Menunggu Keputusan Administrator</span>
            </div>
            <span class="text-xs text-amber-800 font-mono font-medium">Batas Waktu: 15 Menit</span>
          </div>

          <!-- Data Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-1">
              <span class="text-xs text-on-surface-variant font-medium">Nama Mitra</span>
              <span class="text-base font-bold text-on-surface">{{ approvalView()?.worker_name }}</span>
            </div>

            <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-1">
              <span class="text-xs text-on-surface-variant font-medium">Nomor WhatsApp Terdaftar</span>
              <span class="text-base font-bold font-mono text-on-surface">{{ approvalView()?.worker_phone }}</span>
            </div>

            <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-1">
              <span class="text-xs text-on-surface-variant font-medium">Jenis Permohonan</span>
              <span class="text-base font-bold text-primary">
                {{ approvalView()?.request_type === 'RESET_PIN' ? 'Reset PIN Keamanan Akun' : 'Ganti Nomor WhatsApp Terdaftar' }}
              </span>
            </div>

            <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-1">
              <span class="text-xs text-on-surface-variant font-medium">Waktu Pengajuan</span>
              <span class="text-sm font-semibold text-on-surface">
                {{ approvalView()?.created_at | date:'dd MMM yyyy, HH:mm' }} WIB
              </span>
            </div>
          </div>

          <!-- Instruksi Keamanan untuk Admin -->
          <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-start gap-3">
            <span class="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">verified</span>
            <div class="flex flex-col gap-1 text-xs text-on-surface-variant leading-relaxed">
              <strong class="text-on-surface font-semibold">Protokol Keamanan Operator:</strong>
              Pastikan Anda telah mengonfirmasi permohonan ini secara langsung dengan mitra terkait melalui riwayat chat WhatsApp. Setelah disetujui, tautan eksekusi sekali pakai (Tier-2, 10 menit) akan diterbitkan.
            </div>
          </div>

          <!-- Tombol Keputusan -->
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/40">
            <a
              routerLink="/admin/workers"
              class="px-5 py-2.5 rounded-xl border border-outline text-on-surface font-semibold hover:bg-surface-container transition-colors text-sm min-h-[48px] flex items-center"
            >
              Tolak / Batal
            </a>
            <button
              type="button"
              (click)="approveRequest()"
              [disabled]="isApproving()"
              class="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 min-h-[48px] text-sm"
            >
              @if (isApproving()) {
                <span class="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Memproses Persetujuan...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Setujui & Terbitkan Tautan Mitra</span>
              }
            </button>
          </div>
        </div>
      }

      <!-- State: Sukses Disetujui -->
      @if (approveSuccess()) {
        <div class="p-6 bg-surface border border-emerald-200 rounded-2xl shadow-xs flex flex-col gap-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[28px]">task_alt</span>
            </div>
            <div class="flex flex-col gap-1">
              <h3 class="font-heading-h3 text-lg font-bold text-on-surface">
                Permohonan Berhasil Disetujui!
              </h3>
              <p class="font-body-default text-sm text-on-surface-variant leading-relaxed">
                Tautan eksekusi pembaruan kredensial sekali pakai telah dibuat dan aktif selama 10 menit. Silakan kirimkan tautan ini langsung ke WhatsApp mitra.
              </p>
            </div>
          </div>

          <!-- Tautan Eksekusi Box -->
          <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 flex flex-col gap-2.5">
            <div class="flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span>Tautan Eksekusi Mitra (Sekali Pakai):</span>
              <span class="text-emerald-700 font-semibold">Aktif (10 Menit)</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                [value]="approveSuccess()?.execution_url"
                class="w-full p-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs font-mono text-on-surface outline-none select-all"
              />
              <button
                type="button"
                (click)="copyExecutionLink()"
                class="px-4 py-2.5 rounded-lg border border-outline text-xs font-semibold hover:bg-surface-container transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <span class="material-symbols-outlined text-[16px]">
                  {{ copied() ? 'check' : 'content_copy' }}
                </span>
                <span>{{ copied() ? 'Tersalin' : 'Salin' }}</span>
              </button>
            </div>
          </div>

          <!-- Tombol WhatsApp Mitra -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <a
              [href]="approveSuccess()?.whatsapp_share_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 py-3 px-5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[48px] text-sm"
            >
              <span class="material-symbols-outlined text-[20px]">chat</span>
              <span>Kirim Tautan via WhatsApp Mitra</span>
            </a>

            <a
              routerLink="/admin/workers"
              class="px-5 py-3 rounded-xl border border-outline text-on-surface font-semibold hover:bg-surface-container transition-colors text-center text-sm min-h-[48px] flex items-center justify-center"
            >
              Selesai & Kembali ke Panel
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminCredentialResetApprovalPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string>('');
  readonly approvalView = signal<AdminResetApprovalView | null>(null);
  readonly isApproving = signal<boolean>(false);
  readonly approveSuccess = signal<AdminApproveResetResponse | null>(null);
  readonly copied = signal<boolean>(false);

  private rawToken: string = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('Parameter token permohonan reset tidak ditemukan pada tautan.');
      return;
    }
    this.rawToken = token.trim();
    this.verifyToken();
  }

  private verifyToken(): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.verifyResetRequestByAdmin(this.rawToken).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.approvalView.set(res.data);
        } else {
          this.error.set(res.error || 'Tautan permohonan reset tidak valid atau telah kedaluwarsa.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Gagal terhubung ke server pengelola.');
      },
    });
  }

  approveRequest(): void {
    if (!this.rawToken) return;

    this.isApproving.set(true);
    this.authService.approveCredentialReset(this.rawToken).subscribe({
      next: (res) => {
        this.isApproving.set(false);
        if (res.success && res.data) {
          this.approveSuccess.set(res.data);
        } else {
          this.error.set(res.error || 'Gagal menyetujui permohonan reset.');
        }
      },
      error: (err) => {
        this.isApproving.set(false);
        this.error.set(err?.message || 'Terjadi kesalahan sistem saat menyetujui permohonan.');
      },
    });
  }

  copyExecutionLink(): void {
    const url = this.approveSuccess()?.execution_url;
    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }
}

