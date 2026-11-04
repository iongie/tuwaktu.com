import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

@Component({
  selector: 'app-rates-service-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col gap-6 transition-all hover:shadow-md border border-hairline-subtle"
    >
      <!-- Card Header: Mode, Code, Title & Rate Display -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            @if (service().rate_type === 'HOURLY') {
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed-variant text-micro-uppercase font-micro-uppercase font-bold tracking-wider"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-voltage-orange animate-pulse"></span>
                MODE: PER JAM (HOURLY)
              </span>
            } @else {
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-warning-surface text-warning text-micro-uppercase font-micro-uppercase font-bold tracking-wider"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                MODE: PER SESI / PAKET
              </span>
            }
            <span
              class="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant text-micro-uppercase font-micro-uppercase"
            >
              KODE: {{ service().code }}
            </span>
          </div>
          <h2 class="font-heading-2 text-heading-2 text-on-surface font-bold">
            {{ service().name }}
          </h2>
        </div>

        <div class="sm:text-right flex sm:flex-col items-baseline justify-between sm:justify-start gap-1">
          <div class="flex items-baseline gap-1.5">
            <span class="font-heading-2 text-heading-2 text-primary font-bold">
              {{ formattedPriceDisplay() }}
            </span>
            <span class="font-caption text-caption text-ink-secondary">
              {{ service().rate_type === 'HOURLY' ? '/ jam' : '/ paket flat' }}
            </span>
          </div>
          <span class="text-micro-uppercase font-micro-uppercase text-success font-semibold">
            100% Milik Anda
          </span>
        </div>
      </div>

      <!-- Card Body: Image & Technical Service Specs -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
        <!-- Visual Media / Equipment Photo -->
        <div class="md:col-span-5 h-44 rounded-lg overflow-hidden relative shadow-inner bg-surface-container-low">
          @if (service().image_url) {
            <img
              class="w-full h-full object-cover"
              [src]="service().image_url"
              [alt]="service().name"
            />
          } @else {
            <div class="w-full h-full flex items-center justify-center bg-surface-container text-ink-secondary">
              <span class="material-symbols-outlined text-4xl">home_repair_service</span>
            </div>
          }
          <div
            class="absolute bottom-2 left-2 right-2 bg-hero-canvas/80 backdrop-blur-md px-3 py-1.5 rounded text-on-primary flex items-center justify-between text-caption font-caption"
          >
            <span class="truncate font-medium">
              {{ service().equipment_badge || 'Alat Kerja Standar Profesional' }}
            </span>
            <span class="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
              {{ service().equipment_icon || 'verified' }}
            </span>
          </div>
        </div>

        <!-- Service Scope, Allocation & Feature Chips -->
        <div class="md:col-span-7 flex flex-col justify-between space-y-3">
          <p class="font-body-default text-body-default text-on-surface-variant leading-relaxed">
            {{ service().description }}
          </p>

          <!-- Specifications Box -->
          <div class="grid grid-cols-2 gap-3 bg-surface-container-low p-3 rounded-lg">
            <div class="flex items-center gap-2 text-caption font-caption text-ink-secondary">
              <span class="material-symbols-outlined text-[18px] text-voltage-orange">
                {{ service().rate_type === 'HOURLY' ? 'timer' : 'pace' }}
              </span>
              <span>
                @if (service().rate_type === 'HOURLY') {
                  Min. Booking: <strong class="text-on-surface font-body-strong">{{ service().min_hours || '2.0' }} Jam</strong>
                } @else {
                  Alokasi: <strong class="text-on-surface font-body-strong">Maks. {{ service().max_hours || '2.0' }} Jam flat</strong>
                }
              </span>
            </div>

            <div class="flex items-center gap-2 text-caption font-caption text-ink-secondary">
              <span class="material-symbols-outlined text-[18px] text-secondary">
                {{ service().rate_type === 'HOURLY' ? 'precision_manufacturing' : 'backpack' }}
              </span>
              <span class="truncate">
                {{ service().equipment_label || 'Peralatan Lengkap' }}
              </span>
            </div>
          </div>

          <!-- Feature Tags -->
          <div class="flex flex-wrap gap-2">
            @for (tag of service().tags; track tag) {
              <span
                class="px-2.5 py-1 rounded bg-surface-highlight text-on-surface text-caption font-caption"
              >
                {{ tag }}
              </span>
            }
          </div>
        </div>
      </div>

      <!-- Card Action Footer Bar: Visibility Switch & Edit Actions -->
      <div
        class="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-bright p-3.5 rounded-lg border border-hairline-subtle"
      >
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <div class="relative">
            <input
              type="checkbox"
              [checked]="service().is_public"
              (change)="toggleVisibility.emit(service().id)"
              class="sr-only peer"
            />
            <div
              class="w-11 h-6 bg-surface-variant rounded-full peer-checked:bg-voltage-orange transition-colors"
            ></div>
            <div
              class="dot absolute left-1 top-1 bg-surface-container-lowest w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"
            ></div>
          </div>
          <span class="font-body-strong text-body-strong text-on-surface text-xs sm:text-sm">
            {{ service().is_public ? 'Tampilkan di Profil Publik' : 'Disembunyikan dari Publik' }}
          </span>
        </label>

        <div class="flex items-center gap-2 flex-wrap">
          @if (service().rate_type === 'HOURLY') {
            <button
              type="button"
              (click)="editDuration.emit(service())"
              class="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-button-label font-button-label hover:bg-surface-variant transition-colors min-h-[44px] cursor-pointer"
            >
              Ubah Durasi Minimum
            </button>
          }
          <button
            type="button"
            (click)="editService.emit(service())"
            class="px-4 py-2 rounded-lg bg-primary text-on-primary text-button-label font-button-label hover:bg-neutral-800 transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Tarif & Ketentuan</span>
          </button>
        </div>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesServiceCardComponent {
  readonly service = input.required<WorkerServiceCatalogItem>();

  readonly toggleVisibility = output<string>();
  readonly editService = output<WorkerServiceCatalogItem>();
  readonly editDuration = output<WorkerServiceCatalogItem>();

  readonly formattedPriceDisplay = computed(() => {
    const rawPrice = Number(this.service().price) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(rawPrice);
  });
}
