import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityTestimonial } from '../../../models/home.model';

@Component({
  selector: 'app-home-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      id="testimoni"
      class="w-full bg-body-canvas py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="testimonials-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="max-w-2xl space-y-space-xs">
          <div class="flex items-center gap-space-xs">
            <span
              class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
            >
              Suara Komunitas
            </span>
          </div>

          <h2
            id="testimonials-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Pengalaman Nyata Teknisi &amp; Pemesan
          </h2>

          <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
            Cerita dari pekerja mandiri yang mengambil alih kedaulatan tarif mereka dan klien yang menikmati kepastian jadwal.
          </p>
        </div>

        <!-- 3-Column Testimonial Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          @for (item of testimonials; track item.id) {
            <article
              class="m3-card-outlined p-space-xl bg-body-canvas flex flex-col justify-between h-full space-y-space-md"
            >
              <div class="space-y-space-sm">
                <!-- Rating Stars & Badge -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-0.5 text-voltage-orange">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <span class="material-symbols-outlined text-[18px]">star</span>
                    }
                  </div>
                  <span
                    class="px-2 py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase font-bold uppercase"
                  >
                    {{ item.verifiedBadge }}
                  </span>
                </div>

                <!-- Testimonial Quote -->
                <p class="font-body-default text-body-default text-on-surface leading-relaxed italic">
                  "{{ item.comment }}"
                </p>
              </div>

              <!-- Author Info -->
              <div class="pt-space-md border-t border-hairline-subtle flex items-center gap-space-sm">
                <img
                  [src]="item.avatarUrl"
                  [alt]="item.authorName"
                  class="w-11 h-11 rounded-full object-cover border border-hairline-subtle"
                  loading="lazy"
                />
                <div class="min-w-0">
                  <h3 class="font-body-strong text-body-strong text-on-surface truncate">
                    {{ item.authorName }}
                  </h3>
                  <p class="font-caption text-caption text-ink-secondary truncate">
                    {{ item.role }} • {{ item.location }}
                  </p>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeTestimonialsSectionComponent {
  readonly testimonials: CommunityTestimonial[] = [
    {
      id: 'testi-1',
      authorName: 'Budi Santoso',
      role: 'Teknisi HVAC & Servis AC',
      location: 'Jagakarsa',
      avatarUrl:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      comment:
        'Sebelum memakai Tuwaktu, seperempat omzet bulanan saya habis dipotong komisi aplikasi. Sekarang 100% pendapatan utuh untuk keluarga dan saya bisa mengatur jeda transit antar rumah tanpa terburu-buru.',
      verifiedBadge: 'Teknisi Terverifikasi',
    },
    {
      id: 'testi-2',
      authorName: 'Dian Maharani',
      role: 'Klien Residensial',
      location: 'Senopati',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      comment:
        'Sangat menghargai kepastian jadwal dan buffer waktunya. Teknisi datang tepat pada jam slot yang dipilih, nomor WhatsApp yang dihubungi adalah nomor asli teknisi, dan tarifnya sesuai tanpa kejutan.',
      verifiedBadge: 'Klien Terverifikasi',
    },
    {
      id: 'testi-3',
      authorName: 'Sarah Melinda',
      role: 'Spesialis Sanitasi Kasur & Sofa',
      location: 'Tebet',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      comment:
        'Punya link portofolio sendiri (tuwaktu.com/sarah-cleaning) sangat profesional. Klien langganan saya dari Instagram tinggal buka tautan tersebut untuk memilih hari dan memesan langsung via WhatsApp.',
      verifiedBadge: 'Mitra Kebersihan',
    },
  ];
}
