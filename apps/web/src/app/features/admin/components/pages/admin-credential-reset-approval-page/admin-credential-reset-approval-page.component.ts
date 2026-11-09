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
        <nav class="flex items-center gap-2 text-xs text-ink-secondary font-medium font-mono-rate">
          <a routerLink="/admin/workers" class="hover:text-ink-on-light transition-colors">Kelola Mitra</a>
          <span>/</span>
          <span class="text-ink-on-light font-bold">Persetujuan Reset Kredensial</span>
        </nav>
        <div class="flex items-center gap-2.5 mt-1">
          <div class="w-9 h-9 rounded bg-surface-highlight border border-hairline-light text-voltage-orange flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </div>
          <div>
            <h1 class="font-heading-h2 text-heading-h2 font-bold text-ink-on-light">
              Persetujuan Reset Kredensial Mitra
            </h1>
            <p class="font-body-default text-xs text-ink-secondary">
              Verifikasi keabsahan identitas sebelum menerbitkan tautan eksekusi pembaruan PIN atau WhatsApp mitra.
            </p>
          </div>
        </div>
      </div>

      <!-- State: Loading -->
      @if (loading()) {
        <div class="p-8 bg-body-canvas border border-hairline-light rounded-[10px] flex flex-col items-center justify-center gap-3">
          <span class="inline-block w-8 h-8 border-3 border-hero-canvas border-t-transparent rounded-full animate-spin"></span>
          <span class="text-xs font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">Memverifikasi keabsahan tautan permohonan...</span>
        </div>
      }

      <!-- State: Error -->
      @if (error()) {
        <div class="p-6 bg-red-50 border border-red-200 rounded-[10px] flex flex-col gap-4 text-red-950">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-red-600 text-[24px] shrink-0 mt-0.5">error</span>
            <div class="flex flex-col gap-1">
              <h3 class="font-heading-h3 text-base font-bold text-red-950">Permohonan Tidak Dapat Diverifikasi</h3>
              <p class="text-xs text-red-800 leading-relaxed">{{ error() }}</p>
            </div>
          </div>
          <div class="pt-2">
            <a
              routerLink="/admin/workers"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-body-canvas border border-hairline-light text-ink-on-light text-xs font-bold uppercase tracking-wider hover:bg-surface-highlight transition-colors min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Kembali ke Panel Pengelola Mitra</span>
            </a>
          </div>
        </div>
      }

      <!-- State: Detail Permohonan & Konfirmasi -->
      @if (!loading() && !error() && approvalView() && !approveSuccess()) {
        <div class="p-6 bg-body-canvas border border-hairline-light rounded-[10px] shadow-none flex flex-col gap-6">
          <!-- Status Banner -->
          <div class="flex items-center justify-between p-3.5 bg-surface-highlight border border-hairline-light rounded text-ink-on-light text-xs">
            <div class="flex items-center gap-2 font-mono-rate font-bold uppercase tracking-wider">
              <span class="material-symbols-outlined text-voltage-orange text-[18px]">hourglass_top</span>
              <span>Menunggu Keputusan Administrator</span>
            </div>
            <span class="text-[11px] text-ink-secondary font-mono-rate font-medium">Batas Waktu: 15 Menit</span>
          </div>

          <!-- Data Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 bg-surface-highlight rounded border border-hairline-light flex flex-col gap-1">
              <span class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">Nama Mitra</span>
              <span class="text-sm font-bold text-ink-on-light">{{ approvalView()?.worker_name }}</span>
            </div>

            <div class="p-4 bg-surface-highlight rounded border border-hairline-light flex flex-col gap-1">
              <span class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">Nomor WhatsApp Terdaftar</span>
              <span class="text-sm font-bold font-mono-rate text-ink-on-light">{{ approvalView()?.worker_phone }}</span>
            </div>

            <div class="p-4 bg-surface-highlight rounded border border-hairline-light flex flex-col gap-1">
              <span class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">Jenis Permohonan</span>
              <span class="text-sm font-bold text-ink-on-light">
                {{ approvalView()?.request_type === 'RESET_PIN' ? 'Reset PIN Keamanan Akun' : 'Ganti Nomor WhatsApp Terdaftar' }}
              </span>
            </div>

            <div class="p-4 bg-surface-highlight rounded border border-hairline-light flex flex-col gap-1">
              <span class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">Waktu Pengajuan</span>
              <span class="text-xs font-mono-rate font-bold text-ink-on-light">
                {{ approvalView()?.created_at | date:'dd MMM yyyy, HH:mm' }} WIB
              </span>
            </div>
          </div>

          <!-- Instruksi Keamanan untuk Admin -->
          <div class="p-4 bg-surface-highlight rounded border border-hairline-light flex items-start gap-3">
            <span class="material-symbols-outlined text-whatsapp-green text-[20px] shrink-0 mt-0.5">verified</span>
            <div class="flex flex-col gap-1 text-xs text-ink-secondary leading-relaxed">
              <strong class="text-ink-on-light font-bold">Protokol Keamanan Operator:</strong>
              Pastikan Anda telah mengonfirmasi permohonan ini secara langsung dengan mitra terkait melalui riwayat chat WhatsApp. Setelah disetujui, tautan eksekusi sekali pakai (Tier-2, 10 menit) akan diterbitkan.
            </div>
          </div>

          <!-- Tombol Keputusan -->
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-hairline-light">
            <a
              routerLink="/admin/workers"
              class="px-5 py-2.5 rounded border border-hairline-light text-ink-on-light bg-body-canvas hover:bg-surface-highlight font-bold text-xs uppercase tracking-wider transition-colors min-h-[44px] flex items-center"
            >
              Tolak / Batal
            </a>
            <button
              type="button"
              (click)="approveRequest()"
              [disabled]="isApproving()"
              class="px-6 py-2.5 rounded bg-hero-canvas text-ink-on-dark hover:bg-[#262626] font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
            >
              @if (isApproving()) {
                <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Memproses Persetujuan...</span>
              } @else {
                <span class="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Setujui &amp; Terbitkan Tautan Mitra</span>
              }
            </button>
          </div>
        </div>
      }

      <!-- State: Sukses Disetujui -->
      @if (approveSuccess()) {
        <div class="p-6 bg-body-canvas border border-hairline-light rounded-[10px] shadow-none flex flex-col gap-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/20 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[28px] text-whatsapp-green">task_alt</span>
            </div>
            <div class="flex flex-col gap-1">
              <h3 class="font-heading-h3 text-base font-bold text-ink-on-light">
                Permohonan Berhasil Disetujui!
              </h3>
              <p class="font-body-default text-xs text-ink-secondary leading-relaxed">
                Tautan eksekusi pembaruan kredensial sekali pakai telah dibuat dan aktif selama 10 menit. Silakan kirimkan tautan ini langsung ke WhatsApp mitra.
              </p>
            </div>
          </div>

          <!-- Tautan Eksekusi Box -->
          <div class="p-4 bg-surface-highlight rounded border border-hairline-light flex flex-col gap-2.5">
            <div class="flex items-center justify-between text-xs text-ink-secondary font-medium font-mono-rate">
              <span>Tautan Eksekusi Mitra (Sekali Pakai):</span>
              <span class="text-whatsapp-green font-bold uppercase tracking-wider">Aktif (10 Menit)</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                [value]="approveSuccess()?.execution_url"
                class="w-full p-2.5 bg-body-canvas rounded border border-hairline-light text-xs font-mono-rate text-ink-on-light outline-none select-all"
              />
              <button
                type="button"
                (click)="copyExecutionLink()"
                class="px-4 py-2.5 rounded border border-hairline-light bg-body-canvas text-ink-on-light font-bold text-xs uppercase tracking-wider hover:bg-surface-highlight transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
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
              class="flex-1 py-3 px-5 rounded bg-whatsapp-green text-white hover:bg-whatsapp-green-hover font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span class="material-symbols-outlined text-[18px]">chat</span>
              <span>Kirim Tautan via WhatsApp Mitra</span>
            </a>

            <a
              routerLink="/admin/workers"
              class="px-5 py-3 rounded border border-hairline-light bg-body-canvas text-ink-on-light hover:bg-surface-highlight font-bold text-xs uppercase tracking-wider transition-colors text-center min-h-[48px] flex items-center justify-center"
            >
              Selesai &amp; Kembali ke Panel
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

