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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
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
          class="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[16px] bg-body-canvas border border-hairline-light p-6 md:p-8 shadow-none"
        >
          <button
            type="button"
            class="absolute top-6 right-6 min-w-[36px] min-h-[36px] flex items-center justify-center rounded border border-hairline-light text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight transition cursor-pointer"
            aria-label="Tutup jendela"
            (click)="handleClose()"
            data-testid="close-category-modal-btn"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <header class="mb-6 space-y-1">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-surface-highlight border border-hairline-light text-ink-on-light font-mono-rate text-[10px] font-bold uppercase tracking-wider">
              Katalog Keahlian
            </div>
            <h2 id="categoryModalTitle" class="text-xl font-bold tracking-tight text-ink-on-light">
              {{ category() ? 'Perbarui Kategori Keahlian' : 'Tambah Kategori Baru' }}
            </h2>
            <p class="text-xs text-ink-secondary">
              {{ category() ? 'Perbarui data spesialisasi dan parameter tarif awal.' : 'Lengkapi informasi keahlian teknisi untuk ditampilkan pada katalog publik.' }}
            </p>
          </header>

          <form (ngSubmit)="handleSubmit()" class="space-y-4">
            <div>
              <label for="cat-name" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                Nama Kategori <span class="text-rose-500">*</span>
              </label>
              <input
                id="cat-name"
                name="name"
                type="text"
                required
                [ngModel]="formName()"
                (ngModelChange)="formName.set($event)"
                placeholder="Contoh: Servis & Pasang AC"
                class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                data-testid="category-name-input"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="cat-slug" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                  Slug URL (Opsional)
                </label>
                <input
                  id="cat-slug"
                  name="slug"
                  type="text"
                  [ngModel]="formSlug()"
                  (ngModelChange)="formSlug.set($event)"
                  placeholder="otomatis dari nama"
                  class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                  data-testid="category-slug-input"
                />
              </div>

              <div>
                <label for="cat-icon" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                  Ikon Material
                </label>
                <input
                  id="cat-icon"
                  name="icon"
                  type="text"
                  [ngModel]="formIcon()"
                  (ngModelChange)="formIcon.set($event)"
                  placeholder="ac_unit, bolt, tv, build"
                  class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                  data-testid="category-icon-input"
                />
              </div>
            </div>

            <div>
              <label for="cat-desc" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                Deskripsi Cakupan Layanan
              </label>
              <textarea
                id="cat-desc"
                name="description"
                rows="3"
                [ngModel]="formDescription()"
                (ngModelChange)="formDescription.set($event)"
                placeholder="Rincian singkat cakupan pekerjaan teknisi pada kategori ini..."
                class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition resize-none"
                data-testid="category-description-input"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="cat-price" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                  Tarif Mulai Dari (Rp)
                </label>
                <input
                  id="cat-price"
                  name="starting_price"
                  type="number"
                  min="0"
                  step="5000"
                  [ngModel]="formStartingPrice()"
                  (ngModelChange)="formStartingPrice.set($event)"
                  placeholder="75000"
                  class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                  data-testid="category-price-input"
                />
              </div>

              <div>
                <label for="cat-unit" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                  Satuan Tarif
                </label>
                <input
                  id="cat-unit"
                  name="price_unit"
                  type="text"
                  [ngModel]="formPriceUnit()"
                  (ngModelChange)="formPriceUnit.set($event)"
                  placeholder="kunjungan, unit, jam"
                  class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                  data-testid="category-unit-input"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="cat-highlight" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                  Tag Penanda (Highlight)
                </label>
                <input
                  id="cat-highlight"
                  name="highlight_tag"
                  type="text"
                  [ngModel]="formHighlightTag()"
                  (ngModelChange)="formHighlightTag.set($event)"
                  placeholder="Populer, Higienis, Prioritas"
                  class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                  data-testid="category-highlight-input"
                />
              </div>

              <div>
                <label for="cat-sort" class="block text-xs font-bold uppercase tracking-wider text-ink-on-light font-mono-rate mb-1">
                  Urutan Tampil (Sort Order)
                </label>
                <input
                  id="cat-sort"
                  name="sort_order"
                  type="number"
                  min="0"
                  [ngModel]="formSortOrder()"
                  (ngModelChange)="formSortOrder.set($event)"
                  placeholder="1"
                  class="w-full px-4 py-2.5 rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light transition"
                  data-testid="category-sort-input"
                />
              </div>
            </div>

            <div class="pt-2 flex items-center gap-3">
              <input
                id="cat-active"
                name="is_active"
                type="checkbox"
                [ngModel]="formIsActive()"
                (ngModelChange)="formIsActive.set($event)"
                class="w-4 h-4 rounded border-hairline-light text-hero-canvas focus:ring-accent-link"
                data-testid="category-active-checkbox"
              />
              <label for="cat-active" class="text-xs text-ink-on-light font-bold font-mono-rate cursor-pointer">
                Aktifkan di Katalog Beranda Publik
              </label>
            </div>

            <footer class="pt-4 flex items-center justify-end gap-3 border-t border-hairline-light">
              <button
                type="button"
                (click)="handleClose()"
                class="min-h-[44px] px-5 py-2.5 rounded border border-hairline-light text-xs font-bold uppercase tracking-wider font-mono-rate text-ink-on-light bg-body-canvas hover:bg-surface-highlight transition cursor-pointer"
                data-testid="cancel-category-btn"
              >
                Batal
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting() || !formName().trim()"
                class="min-h-[44px] px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate bg-hero-canvas text-ink-on-dark hover:bg-[#262626] disabled:opacity-50 transition cursor-pointer shadow-none"
                data-testid="save-category-btn"
              >
                {{ isSubmitting() ? 'Menyimpan...' : (category() ? 'Simpan Perubahan' : 'Tambah Kategori') }}
              </button>
            </footer>
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
