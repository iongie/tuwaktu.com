import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminCategory,
  CreateAdminCategoryPayload,
} from '../../../models/admin-category.model';

@Component({
  selector: 'app-admin-category-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hero-canvas/70 backdrop-blur-xs transition-opacity"
        role="dialog"
        aria-modal="true"
        aria-labelledby="categoryModalTitle"
      >
        <button
          type="button"
          class="fixed inset-0 w-full h-full cursor-default bg-transparent -z-10"
          aria-label="Tutup dialog kategori"
          (click)="handleClose()"
          tabindex="-1"
        ></button>

        <div
          class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[12px] bg-body-canvas border border-hairline-light shadow-xl flex flex-col"
        >
          <!-- Modal Header (Nocturne Dark Header) -->
          <div class="bg-hero-canvas text-ink-on-dark p-6 flex items-center justify-between border-b border-hairline-dark">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded bg-surface-elevated-dark text-voltage-orange flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[18px]">post_add</span>
              </div>
              <div>
                <h2 id="categoryModalTitle" class="text-lg font-bold tracking-tight text-ink-on-dark font-sans">
                  {{ category() ? 'Sunting Kategori: ' + category()?.name : 'Tambah Kategori Keahlian Baru' }}
                </h2>
                <p class="text-xs text-ink-disabled font-sans">
                  Konfigurasi taksonomi dan penetapan parameter benchmark teknisi
                </p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded bg-surface-elevated-dark text-ink-disabled hover:text-ink-on-dark flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup jendela"
              (click)="handleClose()"
              data-testid="close-category-modal-btn"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <!-- Modal Body Form -->
          <form (ngSubmit)="handleSubmit()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nama Kategori -->
              <div class="flex flex-col gap-1">
                <label for="cat-name" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Nama Kategori Keahlian <span class="text-voltage-orange">*</span>
                </label>
                <input
                  id="cat-name"
                  name="name"
                  type="text"
                  required
                  [ngModel]="formName()"
                  (ngModelChange)="onNameChange($event)"
                  placeholder="Misal: Servis & Pasang AC"
                  class="h-11 px-3.5 bg-surface-highlight focus:bg-body-canvas text-ink-on-light rounded border border-hairline-light outline-none focus:border-hero-canvas text-xs font-mono-rate transition"
                  data-testid="category-name-input"
                />
              </div>

              <!-- Slug Otomatis -->
              <div class="flex flex-col gap-1">
                <label for="cat-slug" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Slug URL Otomatis
                </label>
                <input
                  id="cat-slug"
                  name="slug"
                  type="text"
                  [ngModel]="formSlug()"
                  (ngModelChange)="formSlug.set($event)"
                  placeholder="otomatis dari nama"
                  class="h-11 px-3.5 bg-surface-highlight focus:bg-body-canvas text-ink-on-light rounded border border-hairline-light outline-none focus:border-hero-canvas text-xs font-mono-rate transition"
                  data-testid="category-slug-input"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Ikon Material -->
              <div class="flex flex-col gap-1">
                <label for="cat-icon" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Ikon Material
                </label>
                <div class="flex items-center gap-2">
                  <div class="w-11 h-11 bg-hero-canvas text-voltage-orange rounded flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[20px]">{{ formIcon() || 'build' }}</span>
                  </div>
                  <input
                    id="cat-icon"
                    name="icon"
                    type="text"
                    [ngModel]="formIcon()"
                    (ngModelChange)="formIcon.set($event)"
                    placeholder="ac_unit, bolt, build"
                    class="h-11 px-3 w-full bg-surface-highlight focus:bg-body-canvas text-ink-on-light font-mono-rate text-xs rounded border border-hairline-light outline-none focus:border-hero-canvas transition"
                    data-testid="category-icon-input"
                  />
                </div>
              </div>

              <!-- Tarif Rekomendasi -->
              <div class="flex flex-col gap-1">
                <label for="cat-price" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Tarif Rekomendasi (Rp)
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-rate text-ink-secondary font-bold">Rp</span>
                  <input
                    id="cat-price"
                    name="starting_price"
                    type="number"
                    min="0"
                    step="5000"
                    [ngModel]="formStartingPrice()"
                    (ngModelChange)="formStartingPrice.set($event)"
                    placeholder="75000"
                    class="h-11 pl-9 pr-3 w-full bg-surface-highlight focus:bg-body-canvas text-ink-on-light font-mono-rate text-xs rounded border border-hairline-light outline-none focus:border-hero-canvas transition tabular-nums"
                    data-testid="category-price-input"
                  />
                </div>
              </div>

              <!-- Satuan Tarif -->
              <div class="flex flex-col gap-1">
                <label for="cat-unit" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Satuan Tarif
                </label>
                <input
                  id="cat-unit"
                  name="price_unit"
                  type="text"
                  [ngModel]="formPriceUnit()"
                  (ngModelChange)="formPriceUnit.set($event)"
                  placeholder="unit, jam, kunjungan"
                  class="h-11 px-3.5 bg-surface-highlight focus:bg-body-canvas text-ink-on-light rounded border border-hairline-light outline-none focus:border-hero-canvas text-xs font-mono-rate transition"
                  data-testid="category-unit-input"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Urutan Tampilan -->
              <div class="flex flex-col gap-1 md:col-span-1">
                <label for="cat-sort" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Urutan Prioritas
                </label>
                <input
                  id="cat-sort"
                  name="sort_order"
                  type="number"
                  min="0"
                  [ngModel]="formSortOrder()"
                  (ngModelChange)="formSortOrder.set($event)"
                  placeholder="1"
                  class="h-11 px-3.5 bg-surface-highlight focus:bg-body-canvas text-ink-on-light font-mono-rate text-xs rounded border border-hairline-light outline-none focus:border-hero-canvas transition tabular-nums"
                  data-testid="category-sort-input"
                />
              </div>

              <!-- Tag Penanda / Highlight -->
              <div class="flex flex-col gap-1 md:col-span-1">
                <label for="cat-highlight" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Tag Penanda
                </label>
                <input
                  id="cat-highlight"
                  name="highlight_tag"
                  type="text"
                  [ngModel]="formHighlightTag()"
                  (ngModelChange)="formHighlightTag.set($event)"
                  placeholder="Populer, Higienis"
                  class="h-11 px-3.5 bg-surface-highlight focus:bg-body-canvas text-ink-on-light rounded border border-hairline-light outline-none focus:border-hero-canvas text-xs font-mono-rate transition"
                  data-testid="category-highlight-input"
                />
              </div>

              <!-- Deskripsi Ringkas -->
              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="cat-desc" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate">
                  Deskripsi Cakupan Layanan
                </label>
                <textarea
                  id="cat-desc"
                  name="description"
                  rows="1"
                  [ngModel]="formDescription()"
                  (ngModelChange)="formDescription.set($event)"
                  placeholder="Rangkuman spesialisasi yang tampil pada pencarian..."
                  class="h-11 p-2.5 bg-surface-highlight focus:bg-body-canvas text-ink-on-light rounded border border-hairline-light outline-none focus:border-hero-canvas text-xs font-sans transition resize-none"
                  data-testid="category-description-input"
                ></textarea>
              </div>
            </div>

            <!-- Toggle Visibilitas Publik -->
            <div class="flex items-center justify-between p-3.5 bg-surface-highlight border border-hairline-light rounded-[10px]">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[20px] text-whatsapp-green">visibility</span>
                <div class="flex flex-col">
                  <span class="font-bold text-ink-on-light text-xs font-mono-rate uppercase tracking-wider">Visibilitas Publik</span>
                  <span class="text-[11px] text-ink-secondary">Aktifkan langsung di beranda tamu &amp; saringan filter pencarian</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <input
                  id="cat-active"
                  name="is_active"
                  type="checkbox"
                  [ngModel]="formIsActive()"
                  (ngModelChange)="formIsActive.set($event)"
                  class="w-4 h-4 rounded border-hairline-light text-hero-canvas focus:ring-accent-link cursor-pointer"
                  data-testid="category-active-checkbox"
                />
                <label for="cat-active" class="text-xs text-ink-on-light font-bold font-mono-rate cursor-pointer">
                  {{ formIsActive() ? 'Aktif' : 'Nonaktif' }}
                </label>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-hairline-light">
              <span class="text-[10px] font-mono-rate text-ink-disabled uppercase tracking-wider">
                DIKELOLA VIA KONSOL ADMIN TUWAKTU
              </span>
              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  (click)="handleClose()"
                  class="h-10 px-5 rounded border border-hairline-light text-xs font-bold uppercase tracking-wider font-mono-rate text-ink-on-light bg-body-canvas hover:bg-surface-highlight transition cursor-pointer"
                  data-testid="cancel-category-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  [disabled]="isSubmitting() || !formName().trim()"
                  class="h-10 px-6 rounded text-xs font-bold uppercase tracking-wider font-mono-rate bg-hero-canvas text-ink-on-dark hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer shadow-none flex items-center gap-1.5"
                  data-testid="save-category-btn"
                >
                  <span class="material-symbols-outlined text-[16px] text-voltage-orange">check</span>
                  <span>{{ isSubmitting() ? 'Menyimpan...' : (category() ? 'Simpan Perubahan' : 'Tambah Kategori') }}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminCategoryModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly category = input<AdminCategory | null>(null);
  readonly isSubmitting = input<boolean>(false);

  readonly close = output<void>();
  readonly save = output<CreateAdminCategoryPayload>();

  readonly formName = signal<string>('');
  readonly formSlug = signal<string>('');
  readonly formDescription = signal<string>('');
  readonly formIcon = signal<string>('build');
  readonly formStartingPrice = signal<number>(75000);
  readonly formPriceUnit = signal<string>('kunjungan');
  readonly formAvailabilityTag = signal<string>('Tersedia di Katalog');
  readonly formHighlightTag = signal<string>('');
  readonly formIsActive = signal<boolean>(true);
  readonly formSortOrder = signal<number>(0);

  constructor() {
    effect(() => {
      const cat = this.category();
      if (cat) {
        this.formName.set(cat.name || '');
        this.formSlug.set(cat.slug || '');
        this.formDescription.set(cat.description || '');
        this.formIcon.set(cat.icon || 'build');
        this.formStartingPrice.set(cat.starting_price || 0);
        this.formPriceUnit.set(cat.price_unit || 'kunjungan');
        this.formAvailabilityTag.set(cat.availability_tag || 'Tersedia di Katalog');
        this.formHighlightTag.set(cat.highlight_tag || '');
        this.formIsActive.set(cat.is_active ?? true);
        this.formSortOrder.set(cat.sort_order || 0);
      } else {
        this.resetForm();
      }
    });
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.handleClose();
    }
  }

  onNameChange(value: string): void {
    this.formName.set(value);
    if (!this.category() && (!this.formSlug() || this.formSlug() === this.slugify(this.formName()))) {
      this.formSlug.set(this.slugify(value));
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  handleClose(): void {
    this.close.emit();
  }

  handleSubmit(): void {
    const trimmedName = this.formName().trim();
    if (!trimmedName) {
      return;
    }

    const payload: CreateAdminCategoryPayload = {
      name: trimmedName,
      slug: this.formSlug().trim() || undefined,
      description: this.formDescription().trim(),
      icon: this.formIcon().trim() || 'build',
      starting_price: Number(this.formStartingPrice()) || 0,
      price_unit: this.formPriceUnit().trim() || 'kunjungan',
      availability_tag: this.formAvailabilityTag().trim() || 'Tersedia di Katalog',
      highlight_tag: this.formHighlightTag().trim() || '',
      is_active: this.formIsActive(),
      sort_order: Number(this.formSortOrder()) || 0,
    };

    this.save.emit(payload);
  }

  private resetForm(): void {
    this.formName.set('');
    this.formSlug.set('');
    this.formDescription.set('');
    this.formIcon.set('build');
    this.formStartingPrice.set(75000);
    this.formPriceUnit.set('kunjungan');
    this.formAvailabilityTag.set('Tersedia di Katalog');
    this.formHighlightTag.set('');
    this.formIsActive.set(true);
    this.formSortOrder.set(0);
  }
}
