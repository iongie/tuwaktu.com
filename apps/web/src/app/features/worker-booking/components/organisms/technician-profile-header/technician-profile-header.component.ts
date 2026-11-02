import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';

@Component({
  selector: 'app-technician-profile-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="m3-card-surface p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <img
          [src]="workerProfile().avatar_url"
          [alt]="'Foto profil ' + workerProfile().name"
          class="w-20 h-20 rounded-2xl object-cover border border-[#D2C4BE] bg-[#EAE6DF]"
        />
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h2 class="text-2xl font-serif font-bold tracking-tight text-[#141413]">
              {{ workerProfile().name }}
            </h2>
            <span
              class="text-[11px] font-mono bg-[#CBECE0] text-[#002116] px-2.5 py-0.5 rounded font-semibold uppercase"
            >
              Mitra Terverifikasi
            </span>
            @if (formattedRate(); as rateText) {
              <span
                class="text-[11px] font-mono bg-[#FFDAD3] text-[#3F0300] px-2.5 py-0.5 rounded font-bold border border-[#C84B31]/20"
              >
                {{ rateText }}
              </span>
            }
          </div>
          <p class="text-xs sm:text-sm text-[#4E4642] leading-relaxed mb-3.5">
            {{ workerProfile().bio }}
          </p>
          <div class="flex flex-wrap items-center gap-4 text-xs font-mono text-[#141413]">
            <span class="font-semibold text-[#C84B31]">
              Rating {{ workerProfile().rating }} / 5.0
              <span class="font-normal text-[#4E4642]">
                ({{ workerProfile().review_count }} ulasan terverifikasi)
              </span>
            </span>
            <span class="text-[#7A716C]">&bull;</span>
            <span>
              Zona Layanan: <strong class="font-semibold">{{ workerProfile().zone }}</strong>
            </span>
            @if (formattedRate(); as rateText) {
              <span class="text-[#7A716C]">&bull;</span>
              <span>
                Tarif Dasar: <strong class="font-bold text-[#C84B31]">{{ rateText }}</strong>
              </span>
            }
          </div>
        </div>
      </div>
    </article>
  `,
})
export class TechnicianProfileHeaderComponent {
  readonly workerProfile = input.required<PublicTechnicianProfile>();

  readonly formattedRate = computed(() => {
    const profile = this.workerProfile();
    let price = profile.base_price;
    let rateType = profile.rate_type;

    if (!price || price <= 0 || Number.isNaN(price)) {
      if (profile.services && profile.services.length > 0) {
        price = profile.services[0].base_price || profile.services[0].price;
        rateType = profile.services[0].rate_type || 'HOURLY';
      }
    }

    if (!price || price <= 0 || Number.isNaN(price)) {
      return null;
    }

    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);

    const unitLabel = (rateType || '').toUpperCase() === 'UNIT' ? 'Sesi' : 'Jam';
    return `${formattedPrice} / ${unitLabel}`;
  });
}

