import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
          </div>
        </div>
      </div>
    </article>
  `,
})
export class TechnicianProfileHeaderComponent {
  readonly workerProfile = input.required<PublicTechnicianProfile>();
}

