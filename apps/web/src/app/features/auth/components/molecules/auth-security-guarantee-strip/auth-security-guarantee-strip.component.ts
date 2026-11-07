import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-security-guarantee-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full bg-body-canvas rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
      role="region"
      aria-label="Privasi & Keamanan Akun"
    >
      <div class="flex items-center gap-3.5">
        <div
          class="w-10 h-10 rounded-full bg-success-surface flex items-center justify-center text-success shrink-0"
        >
          <span class="material-symbols-outlined text-[20px]">verified_user</span>
        </div>
        <div class="flex flex-col">
          <span class="font-body-strong text-body-strong text-ink-on-light">
            Data Klien Milik Anda Sepenuhnya
          </span>
          <span class="font-caption text-caption text-ink-secondary">
            Tuwaktu tidak mengumpulkan atau memonetisasi riwayat transaksi dan nomor pelanggan Anda.
          </span>
        </div>
      </div>

      <div class="flex items-center gap-6 shrink-0 self-stretch md:self-auto justify-between md:justify-end">
        <div class="flex items-center gap-1.5 text-ink-secondary font-caption text-caption">
          <span class="material-symbols-outlined text-[16px] text-voltage-orange">bolt</span>
          <span>Pendaftaran Praktis & Mandiri</span>
        </div>
        <div class="flex items-center gap-1.5 text-ink-secondary font-caption text-caption">
          <span class="material-symbols-outlined text-[16px] text-whatsapp-green">verified</span>
          <span>Privasi & Keamanan Data Terjaga</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSecurityGuaranteeStripComponent {}
