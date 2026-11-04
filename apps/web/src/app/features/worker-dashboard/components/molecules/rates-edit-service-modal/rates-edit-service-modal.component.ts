import { ChangeDetectionStrategy, Component, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

@Component({
  selector: 'app-rates-edit-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editServiceModalTitle"
    >
      <button
        type="button"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default w-full h-full border-0"
        (click)="dismissModal.emit()"
        aria-label="Tutup Latar Belakang Modal"
      ></button>

      <div
        class="relative z-10 bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-hairline-subtle my-8"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-hairline-subtle">
          <div>
            <h3 id="editServiceModalTitle" class="font-heading-3 text-heading-3 text-on-surface font-bold">
              {{ serviceItem() ? 'Edit Tarif & Ketentuan Layanan' : 'Tambah Layanan Baru' }}
            </h3>
            <p class="text-caption font-caption text-ink-secondary mt-0.5">
              Kelola rincian katalog, skema tarif per jam atau flat, serta spesifikasi operasional.
            </p>
          </div>
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="p-2 text-ink-secondary hover:text-primary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup Form"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Form Body -->
        <form (ngSubmit)="submitForm()" class="space-y-4">
          <!-- Nama Layanan -->
          <div class="space-y-1.5">
            <label for="serviceNameInput" class="block text-xs font-bold text-on-surface">
              Nama Layanan <span class="text-voltage-orange">*</span>
            </label>
            <input
              id="serviceNameInput"
              type="text"
              name="serviceName"
              [ngModel]="serviceName()"
              (ngModelChange)="serviceName.set($event)"
              placeholder="Contoh: Deep Clean Detailing"
              class="w-full px-3.5 py-2.5 bg-surface-container-low border border-hairline-light rounded-lg text-sm text-on-surface min-h-[44px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-voltage-orange"
            />
            @if (validationErrors()['name']) {
              <p class="text-caption font-caption text-error font-semibold">
                {{ validationErrors()['name'] }}
              </p>
            }
          </div>

          <!-- Skema Penagihan -->
          <div class="space-y-2">
            <span class="block text-xs font-bold text-on-surface">
              Skema Penagihan Tarif <span class="text-voltage-orange">*</span>
            </span>
            <div class="grid grid-cols-2 gap-3">
              <label
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                [class.border-voltage-orange]="rateType() === 'HOURLY'"
                [class.bg-orange-50]="rateType() === 'HOURLY'"
                [class.border-hairline-subtle]="rateType() !== 'HOURLY'"
              >
                <input
                  type="radio"
                  name="modalRateType"
                  value="HOURLY"
                  [checked]="rateType() === 'HOURLY'"
                  (change)="rateType.set('HOURLY')"
                  class="w-4 h-4 text-voltage-orange"
                />
                <div>
                  <span class="block text-xs font-bold text-on-surface">Per Jam</span>
                  <span class="text-[10px] font-mono text-voltage-orange font-semibold">HOURLY</span>
                </div>
              </label>

              <label
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                [class.border-voltage-orange]="rateType() === 'UNIT'"
                [class.bg-orange-50]="rateType() === 'UNIT'"
                [class.border-hairline-subtle]="rateType() !== 'UNIT'"
              >
                <input
                  type="radio"
                  name="modalRateType"
                  value="UNIT"
                  [checked]="rateType() === 'UNIT'"
                  (change)="rateType.set('UNIT')"
                  class="w-4 h-4 text-voltage-orange"
                />
                <div>
                  <span class="block text-xs font-bold text-on-surface">Per Paket Flat</span>
                  <span class="text-[10px] font-mono text-secondary font-semibold">UNIT / SESI</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Nominal Tarif -->
          <div class="space-y-1.5">
            <label for="servicePriceInput" class="block text-xs font-bold text-on-surface">
              Nominal Tarif (Rupiah) <span class="text-voltage-orange">*</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="px-3.5 py-2.5 bg-surface-container-high border border-hairline-light rounded-lg font-mono text-sm font-bold text-on-surface-variant min-h-[44px] flex items-center">
                Rp
              </span>
              <input
                id="servicePriceInput"
                type="number"
                min="1000"
                step="5000"
                name="servicePrice"
                [ngModel]="servicePrice()"
                (ngModelChange)="servicePrice.set($event)"
                placeholder="75000"
                class="flex-1 px-3.5 py-2.5 bg-surface-container-low border border-hairline-light rounded-lg text-sm font-mono text-on-surface min-h-[44px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-voltage-orange"
              />
            </div>
            @if (validationErrors()['price']) {
              <p class="text-caption font-caption text-error font-semibold">
                {{ validationErrors()['price'] }}
              </p>
            }
          </div>

          <!-- Durasi / Ketentuan Jam -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label for="serviceDurationInput" class="block text-xs font-bold text-on-surface">
                {{ rateType() === 'HOURLY' ? 'Min. Jam Booking' : 'Maks. Alokasi Durasi (Jam)' }}
              </label>
              <input
                id="serviceDurationInput"
                type="number"
                step="0.5"
                min="0.5"
                name="serviceHours"
                [ngModel]="serviceHours()"
                (ngModelChange)="serviceHours.set($event)"
                placeholder="2.0"
                class="w-full px-3.5 py-2.5 bg-surface-container-low border border-hairline-light rounded-lg text-sm font-mono text-on-surface min-h-[44px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-voltage-orange"
              />
              @if (validationErrors()['hours']) {
                <p class="text-caption font-caption text-error font-semibold">
                  {{ validationErrors()['hours'] }}
                </p>
              }
            </div>

            <div class="space-y-1.5">
              <label for="serviceToolInput" class="block text-xs font-bold text-on-surface">
                Peralatan / Instrumen
              </label>
              <input
                id="serviceToolInput"
                type="text"
                name="serviceEquipment"
                [ngModel]="serviceEquipment()"
                (ngModelChange)="serviceEquipment.set($event)"
                placeholder="Contoh: Polisher & Vac Industri"
                class="w-full px-3.5 py-2.5 bg-surface-container-low border border-hairline-light rounded-lg text-sm text-on-surface min-h-[44px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-voltage-orange"
              />
            </div>
          </div>

          <!-- Deskripsi -->
          <div class="space-y-1.5">
            <label for="serviceDescInput" class="block text-xs font-bold text-on-surface">
              Deskripsi Pekerjaan & Cakupan
            </label>
            <textarea
              id="serviceDescInput"
              rows="3"
              name="serviceDescription"
              [ngModel]="serviceDescription()"
              (ngModelChange)="serviceDescription.set($event)"
              placeholder="Jelaskan detail cakupan pembersihan atau perbaikan..."
              class="w-full px-3.5 py-2.5 bg-surface-container-low border border-hairline-light rounded-lg text-xs leading-relaxed text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-voltage-orange resize-none"
            ></textarea>
          </div>

          <!-- Status Tab Selector -->
          <div class="space-y-1.5">
            <span class="block text-xs font-bold text-on-surface">Status Katalog</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="serviceStatus.set('ACTIVE')"
                class="px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer min-h-[44px] flex-1"
                [class.bg-primary]="serviceStatus() === 'ACTIVE'"
                [class.text-on-primary]="serviceStatus() === 'ACTIVE'"
                [class.bg-surface-container-high]="serviceStatus() !== 'ACTIVE'"
                [class.text-on-surface]="serviceStatus() !== 'ACTIVE'"
              >
                Aktif
              </button>
              <button
                type="button"
                (click)="serviceStatus.set('DRAFT')"
                class="px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer min-h-[44px] flex-1"
                [class.bg-primary]="serviceStatus() === 'DRAFT'"
                [class.text-on-primary]="serviceStatus() === 'DRAFT'"
                [class.bg-surface-container-high]="serviceStatus() !== 'DRAFT'"
                [class.text-on-surface]="serviceStatus() !== 'DRAFT'"
              >
                Draf
              </button>
              <button
                type="button"
                (click)="serviceStatus.set('ARCHIVED')"
                class="px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer min-h-[44px] flex-1"
                [class.bg-primary]="serviceStatus() === 'ARCHIVED'"
                [class.text-on-primary]="serviceStatus() === 'ARCHIVED'"
                [class.bg-surface-container-high]="serviceStatus() !== 'ARCHIVED'"
                [class.text-on-surface]="serviceStatus() !== 'ARCHIVED'"
              >
                Arsip
              </button>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="pt-4 border-t border-hairline-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="dismissModal.emit()"
              class="px-5 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-button-label text-button-label hover:bg-surface-variant transition-colors min-h-[44px] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-6 py-2.5 rounded-lg bg-voltage-orange text-on-primary font-button-label text-button-label hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm min-h-[44px] cursor-pointer"
            >
              <span class="material-symbols-outlined text-[18px]">save</span>
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesEditServiceModalComponent implements OnInit {
  readonly serviceItem = input<WorkerServiceCatalogItem | null>(null);

  readonly dismissModal = output<void>();
  readonly save = output<WorkerServiceCatalogItem>();

  readonly serviceName = signal<string>('');
  readonly servicePrice = signal<number>(65000);
  readonly rateType = signal<'HOURLY' | 'UNIT'>('HOURLY');
  readonly serviceHours = signal<number>(2.0);
  readonly serviceEquipment = signal<string>('');
  readonly serviceDescription = signal<string>('');
  readonly serviceStatus = signal<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  readonly validationErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    const existing = this.serviceItem();
    if (existing) {
      this.serviceName.set(existing.name);
      this.servicePrice.set(existing.price);
      this.rateType.set(existing.rate_type);
      this.serviceHours.set(
        existing.rate_type === 'HOURLY' ? existing.min_hours || 2.0 : existing.max_hours || 2.0
      );
      this.serviceEquipment.set(existing.equipment_label || '');
      this.serviceDescription.set(existing.description || '');
      this.serviceStatus.set(existing.status);
    }
  }

  submitForm(): void {
    const errors: Record<string, string> = {};
    if (!this.serviceName().trim()) {
      errors['name'] = 'Nama layanan wajib diisi.';
    }

    const rawPrice = Number(this.servicePrice());
    if (Number.isNaN(rawPrice) || rawPrice <= 0) {
      errors['price'] = 'Nominal tarif harus lebih besar dari Rp 0.';
    }

    const rawHours = Number(this.serviceHours());
    if (Number.isNaN(rawHours) || rawHours <= 0) {
      errors['hours'] = 'Durasi alokasi jam harus lebih besar dari 0.';
    }

    this.validationErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const existing = this.serviceItem();
    const isHourly = this.rateType() === 'HOURLY';
    const updated: WorkerServiceCatalogItem = {
      id: existing ? existing.id : `srv-${Date.now()}`,
      code: existing ? existing.code : isHourly ? 'DCL-03' : 'GCL-03',
      name: this.serviceName().trim(),
      description: this.serviceDescription().trim(),
      price: rawPrice,
      base_price: rawPrice,
      rate_type: this.rateType(),
      duration_minutes: Math.round(rawHours * 60) || 120,
      min_hours: isHourly ? rawHours : undefined,
      max_hours: !isHourly ? rawHours : undefined,
      equipment_label: this.serviceEquipment().trim() || (isHourly ? 'Polisher & Vac Industri' : 'Alat Bawa Sendiri'),
      equipment_badge: existing?.equipment_badge || (isHourly ? 'Alat Berat Industri Siap Pakai' : 'Pembersihan Cepat & Efisien'),
      equipment_icon: existing?.equipment_icon || (isHourly ? 'verified' : 'flash_on'),
      image_url: existing?.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_PTYqBj7kWz6kDcBIbeqy7Qk6ULYNaPUGnT7rQMruEPhCK6fBXGJhwpQx77ma_hufKEfzP1vn4S2tZ57dWIYRbANbwBxcCP6JVZpQ1Fu1QHdDrioV6J_o7iJ7pWKqD2wUw6C1wg8vp-7fLARDBREYW9WHja4w2wYKc9RvnYUww0an9MTLf1W76ZWrf-pQPUtjDDfQ5sOS3ctx1tfy_o8824LsHgIoVKkMHJGXbDs',
      tags: existing?.tags || ['Bahan Kimia Ramah Lingkungan', 'Alat Lengkap'],
      status: this.serviceStatus(),
      is_public: existing ? existing.is_public : true,
    };

    this.save.emit(updated);
  }
}
