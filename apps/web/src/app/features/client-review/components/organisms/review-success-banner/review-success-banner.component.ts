import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-review-success-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-10 text-center max-w-lg mx-auto shadow-sm">
      <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
        <span class="material-symbols-outlined text-3xl">verified</span>
      </div>

      <h2 class="text-2xl font-bold text-ink-primary mb-2 font-display">
        Terima Kasih Banyak!
      </h2>

      <p class="text-ink-secondary text-sm sm:text-base mb-6 leading-relaxed">
        Ulasan Anda telah berhasil disimpan dan langsung terhubung ke profil reputasi
        <span class="font-semibold text-ink-primary">{{ workerName() }}</span>. Masukan Anda sangat berarti bagi kemajuan teknisi dan membantu pelanggan lainnya.
      </p>

      <div class="pt-2">
        <a
          routerLink="/"
          class="m3-btn-filled inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto text-sm font-semibold rounded-xl min-h-[48px]"
        >
          <span class="material-symbols-outlined text-lg">home</span>
          Kembali ke Beranda Tuwaktu
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewSuccessBannerComponent {
  readonly workerName = input<string>('Teknisi');
}

