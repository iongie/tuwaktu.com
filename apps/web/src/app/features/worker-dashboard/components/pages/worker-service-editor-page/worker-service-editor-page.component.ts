import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';
import { HomeApiService } from '../../../../home/services/home-api.service';
import { WorkerServiceLivePreviewCardComponent } from '../../molecules/worker-service-live-preview-card/worker-service-live-preview-card.component';

@Component({
  selector: 'app-worker-service-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    WorkerServiceLivePreviewCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- BREADCRUMB & HEADER -->
      <div class="flex flex-col gap-4 border-b border-hairline-light pb-5">
        <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-xs text-ink-secondary">
          <a
            routerLink="/dashboard"
            class="hover:text-ink-on-light transition-colors flex items-center gap-1 font-mono-rate"
          >
            <span class="material-symbols-outlined text-[15px]">dashboard</span>
            <span>Dashboard Mitra</span>
          </a>
          <span class="text-ink-disabled font-mono-rate">/</span>
          <a
            routerLink="/dashboard/tarif-layanan"
            class="hover:text-ink-on-light transition-colors font-mono-rate"
          >
            Tarif &amp; Layanan
          </a>
          <span class="text-ink-disabled font-mono-rate">/</span>
          <span class="text-ink-on-light font-bold font-mono-rate">
            {{ isEditMode() ? 'Sunting Layanan' : 'Tambah Layanan Baru' }}
          </span>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex flex-col max-w-3xl">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-ink-on-light tracking-tight">
              {{ isEditMode() ? 'Studio Sunting Spesifikasi Layanan' : 'Studio Pembuatan Layanan Baru' }}
            </h1>
            <p class="text-xs sm:text-sm text-ink-secondary mt-1 leading-relaxed">
              Konfigurasi skema harga transparan, estimasi durasi kalender, dan spesifikasi teknis pengerjaan langsung ke klien tanpa perantara.
            </p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
            <a
              routerLink="/dashboard/tarif-layanan"
              class="h-11 px-5 flex items-center justify-center rounded border border-hairline-light bg-body-canvas text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer select-none"
            >
              Batal
            </a>
            <button
              type="button"
              (click)="handleSaveService()"
              [disabled]="isSubmitting() || !isFormValid()"
              class="h-11 px-6 flex items-center gap-2 rounded bg-hero-canvas text-ink-on-dark hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer shadow-none select-none"
            >
              <span class="material-symbols-outlined text-[18px] text-voltage-orange">
                {{ isEditMode() ? 'save' : 'publish' }}
              </span>
              <span>{{ isEditMode() ? 'Perbarui Layanan' : 'Terbitkan Layanan' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Feedback Error Message -->
      @if (formErrorMessage()) {
        <div class="p-4 rounded-[10px] bg-red-50 border border-red-200 text-red-950 text-xs flex items-center justify-between gap-4">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-red-600 text-[18px]">error</span>
            <span class="font-medium">{{ formErrorMessage() }}</span>
          </div>
          <button
            type="button"
            class="text-red-700 hover:text-red-950 cursor-pointer"
            (click)="formErrorMessage.set(null)"
          >
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      }

      <!-- TWO-COLUMN STUDIO WORKSPACE -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- LEFT STREAM: FORMULIR KONFIGURASI BENTO (8 COLUMNS) -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <!-- BAGIAN 01: IDENTITAS & KLASIFIKASI LAYANAN -->
          <section class="bg-body-canvas p-6 rounded-[10px] border border-hairline-light shadow-none flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-hairline-subtle pb-3">
              <div class="flex items-center gap-2.5">
                <span class="font-mono-rate bg-hero-canvas text-ink-on-dark px-2 py-0.5 rounded text-[11px] font-bold">
                  01
                </span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  Identitas &amp; Klasifikasi Layanan
                </h2>
              </div>
              <span class="text-[10px] font-mono-rate font-bold text-ink-secondary uppercase tracking-wider">
                Taksonomi Mandiri
              </span>
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <label for="serviceNameInput" class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                  Nama Layanan Lengkap <span class="text-voltage-orange">*</span>
                </label>
                <span class="text-[11px] font-mono-rate text-ink-secondary">
                  {{ name().length }} / 80 Karakter
                </span>
              </div>
              <input
                id="serviceNameInput"
                type="text"
                maxlength="80"
                name="serviceName"
                [ngModel]="name()"
                (ngModelChange)="name.set($event)"
                placeholder="Contoh: Pembersihan & Cuci AC Split Presisi"
                class="h-11 px-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-hero-canvas focus:bg-body-canvas transition"
              />
              <span class="text-[11px] text-ink-secondary flex items-center gap-1 mt-0.5 font-sans">
                <span class="material-symbols-outlined text-[14px] text-whatsapp-green">check_circle</span>
                <span>Gunakan penamaan yang deskriptif dan mencerminkan keahlian khusus Anda (minimal 3 karakter).</span>
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="serviceCategorySelect" class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                  Kategori Keahlian <span class="text-voltage-orange">*</span>
                </label>
                <div class="relative">
                  <select
                    id="serviceCategorySelect"
                    name="serviceCategory"
                    [ngModel]="categoryId()"
                    (ngModelChange)="categoryId.set($event)"
                    class="w-full h-11 px-3.5 pr-10 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light focus:outline-none focus:border-hero-canvas focus:bg-body-canvas transition cursor-pointer appearance-none"
                  >
                    <option value="" disabled>Pilih Kategori Keahlian</option>
                    @for (cat of categoriesList(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-3 text-ink-secondary pointer-events-none text-[18px]">
                    unfold_more
                  </span>
                </div>
              </div>

              <div class="flex flex-col justify-end gap-1">
                <span class="text-[11px] text-ink-secondary font-mono-rate">Indeks Pencarian Klien</span>
                <div class="h-11 px-3.5 bg-surface-highlight border border-hairline-light rounded flex items-center gap-2">
                  <span class="material-symbols-outlined text-voltage-orange text-[18px]">verified</span>
                  <span class="font-mono-rate text-xs font-bold text-ink-on-light truncate">
                    Kategori Utama: {{ selectedCategoryName() }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- BAGIAN 02: SKEMA TARIF & DURASI OPERASIONAL -->
          <section class="bg-body-canvas p-6 rounded-[10px] border border-hairline-light shadow-none flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-hairline-subtle pb-3">
              <div class="flex items-center gap-2.5">
                <span class="font-mono-rate bg-hero-canvas text-ink-on-dark px-2 py-0.5 rounded text-[11px] font-bold">
                  02
                </span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  Skema Tarif &amp; Durasi Operasional
                </h2>
              </div>
              <span class="text-[10px] font-mono-rate font-bold text-voltage-orange uppercase tracking-wider">
                Kedaulatan Nilai Jasa
              </span>
            </div>

            <!-- MODEL TARIF SEGMENTED CARDS -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                Pilih Struktur Perhitungan Nilai Layanan
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Flat / Unit Card -->
                <button
                  type="button"
                  (click)="rateType.set('UNIT')"
                  class="text-left p-4 rounded-[10px] border transition-all cursor-pointer flex flex-col gap-1.5"
                  [class.bg-surface-highlight]="rateType() === 'UNIT'"
                  [class.border-hero-canvas]="rateType() === 'UNIT'"
                  [class.ring-1]="rateType() === 'UNIT'"
                  [class.ring-hero-canvas]="rateType() === 'UNIT'"
                  [class.bg-body-canvas]="rateType() !== 'UNIT'"
                  [class.border-hairline-light]="rateType() !== 'UNIT'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-ink-on-light font-mono-rate uppercase flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-voltage-orange text-[18px]">payments</span>
                      <span>Tarif Tetap / Paket (Flat/Unit)</span>
                    </span>
                    <span
                      class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [class.bg-voltage-orange]="rateType() === 'UNIT'"
                      [class.text-white]="rateType() === 'UNIT'"
                      [class.border]="rateType() !== 'UNIT'"
                      [class.border-hairline-light]="rateType() !== 'UNIT'"
                    >
                      ✓
                    </span>
                  </div>
                  <p class="text-xs text-ink-secondary leading-relaxed font-sans">
                    Biaya borongan tetap per unit atau per sesi pekerjaan selesai, tidak terpengaruh variasi menit pengerjaan.
                  </p>
                </button>

                <!-- Hourly Card -->
                <button
                  type="button"
                  (click)="rateType.set('HOURLY')"
                  class="text-left p-4 rounded-[10px] border transition-all cursor-pointer flex flex-col gap-1.5"
                  [class.bg-surface-highlight]="rateType() === 'HOURLY'"
                  [class.border-hero-canvas]="rateType() === 'HOURLY'"
                  [class.ring-1]="rateType() === 'HOURLY'"
                  [class.ring-hero-canvas]="rateType() === 'HOURLY'"
                  [class.bg-body-canvas]="rateType() !== 'HOURLY'"
                  [class.border-hairline-light]="rateType() !== 'HOURLY'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-ink-on-light font-mono-rate uppercase flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-ink-secondary text-[18px]">timer</span>
                      <span>Tarif Per Jam (Hourly)</span>
                    </span>
                    <span
                      class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [class.bg-voltage-orange]="rateType() === 'HOURLY'"
                      [class.text-white]="rateType() === 'HOURLY'"
                      [class.border]="rateType() !== 'HOURLY'"
                      [class.border-hairline-light]="rateType() !== 'HOURLY'"
                    >
                      ✓
                    </span>
                  </div>
                  <p class="text-xs text-ink-secondary leading-relaxed font-sans">
                    Biaya dihitung proporsional per jam durasi waktu kerja teknisi di lokasi secara transparan.
                  </p>
                </button>
              </div>
            </div>

            <!-- INPUT NOMINAL & DURASI -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <!-- Nominal Tarif -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label for="servicePriceInput" class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Nominal Tarif Bersih (Rp) <span class="text-voltage-orange">*</span>
                  </label>
                  <span class="text-[11px] font-mono-rate text-ink-secondary">
                    {{ rateType() === 'HOURLY' ? 'Per Jam (60 Menit)' : 'Per Unit / Paket' }}
                  </span>
                </div>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold font-mono-rate text-ink-secondary">
                    Rp
                  </span>
                  <input
                    id="servicePriceInput"
                    type="number"
                    min="1000"
                    step="5000"
                    name="servicePrice"
                    [ngModel]="price()"
                    (ngModelChange)="price.set(+$event)"
                    placeholder="75000"
                    class="w-full h-11 pl-11 pr-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light tabular-nums placeholder:text-ink-disabled focus:outline-none focus:border-hero-canvas focus:bg-body-canvas transition"
                  />
                </div>
                <div class="flex items-center gap-1.5 text-xs text-whatsapp-green font-medium font-mono-rate">
                  <span class="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>100% Hak Anda Langsung dari Klien (0% Komisi)</span>
                </div>
              </div>

              <!-- Estimasi Durasi Pengerjaan -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label for="serviceDurationSlider" class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Estimasi Durasi Kerja <span class="text-voltage-orange">*</span>
                  </label>
                  <span class="text-xs font-bold font-mono-rate text-ink-on-light bg-surface-highlight px-2 py-0.5 rounded border border-hairline-light">
                    {{ durationMinutes() }} Menit ({{ formatDurationText(durationMinutes()) }})
                  </span>
                </div>
                <div class="h-11 px-3.5 bg-surface-highlight border border-hairline-light rounded flex items-center gap-3">
                  <span class="text-[11px] font-mono-rate text-ink-secondary">15m</span>
                  <input
                    id="serviceDurationSlider"
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    [ngModel]="durationMinutes()"
                    (ngModelChange)="durationMinutes.set(+$event)"
                    class="w-full accent-voltage-orange cursor-pointer"
                  />
                  <span class="text-[11px] font-mono-rate text-ink-secondary">240m</span>
                </div>
                <span class="text-[11px] text-ink-secondary leading-tight flex items-start gap-1 font-sans">
                  <span class="material-symbols-outlined text-[15px] shrink-0 text-ink-secondary">lock_clock</span>
                  <span>Otomatis mengunci dan memperhitungkan slot kalender reservasi Anda.</span>
                </span>
              </div>
            </div>
          </section>

          <!-- BAGIAN 03: CAKUPAN TUGAS & SPESIFIKASI KERJA -->
          <section class="bg-body-canvas p-6 rounded-[10px] border border-hairline-light shadow-none flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-hairline-subtle pb-3">
              <div class="flex items-center gap-2.5">
                <span class="font-mono-rate bg-hero-canvas text-ink-on-dark px-2 py-0.5 rounded text-[11px] font-bold">
                  03
                </span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  Cakupan Tugas &amp; Spesifikasi Kerja
                </h2>
              </div>
              <span class="text-[10px] font-mono-rate font-bold text-ink-secondary uppercase tracking-wider">
                Kejelasan Ekspektasi
              </span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="serviceDescriptionInput" class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                Deskripsi Rincian Pekerjaan Presisi
              </label>
              <textarea
                id="serviceDescriptionInput"
                name="serviceDescription"
                rows="4"
                [ngModel]="description()"
                (ngModelChange)="description.set($event)"
                placeholder="Jelaskan tahapan kerja, alat yang Anda bawa, dan standar kualitas pengerjaan..."
                class="w-full p-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-sans text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-hero-canvas focus:bg-body-canvas transition leading-relaxed resize-y"
              ></textarea>
              <span class="text-[11px] text-ink-secondary font-sans">
                Rincian ini akan dibaca klien sebelum mengirimkan pesanan langsung via WhatsApp.
              </span>
            </div>

            <!-- Ketentuan Pelaksanaan -->
            <div class="flex flex-col gap-2 pt-1">
              <span class="text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                Ketentuan &amp; Fasilitas Pelaksanaan
              </span>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex items-start gap-2.5 p-3.5 bg-surface-highlight border border-hairline-light rounded-[10px]">
                  <span class="material-symbols-outlined text-[18px] text-voltage-orange shrink-0 mt-0.5">water_drop</span>
                  <div class="flex flex-col">
                    <span class="font-bold text-xs text-ink-on-light font-mono-rate uppercase">Sumber Daya Operasional</span>
                    <span class="text-xs text-ink-secondary mt-0.5 font-sans">Klien menyediakan akses air bersih dan colokan listrik di lokasi pekerjaan.</span>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 p-3.5 bg-surface-highlight border border-hairline-light rounded-[10px]">
                  <span class="material-symbols-outlined text-[18px] text-whatsapp-green shrink-0 mt-0.5">verified</span>
                  <div class="flex flex-col">
                    <span class="font-bold text-xs text-ink-on-light font-mono-rate uppercase">Jaminan Garansi Mandiri</span>
                    <span class="text-xs text-ink-secondary mt-0.5 font-sans">Garansi perbaikan mandiri teknisi pasca-layanan pengerjaan selesai.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- BAGIAN 04: STATUS PUBLIKASI LAYANAN -->
          <section class="bg-body-canvas p-6 rounded-[10px] border border-hairline-light shadow-none flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-hairline-subtle pb-3">
              <div class="flex items-center gap-2.5">
                <span class="font-mono-rate bg-hero-canvas text-ink-on-dark px-2 py-0.5 rounded text-[11px] font-bold">
                  04
                </span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  Status Publikasi Layanan
                </h2>
              </div>
              <span class="text-[10px] font-mono-rate font-bold text-ink-secondary uppercase tracking-wider">
                Visibilitas Profil
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Active Mode -->
              <button
                type="button"
                (click)="status.set('ACTIVE')"
                class="p-4 rounded-[10px] border flex items-start gap-3 text-left transition-all cursor-pointer"
                [class.bg-whatsapp-surface]="status() === 'ACTIVE'"
                [class.border-whatsapp-green]="status() === 'ACTIVE'"
                [class.ring-1]="status() === 'ACTIVE'"
                [class.ring-whatsapp-green]="status() === 'ACTIVE'"
                [class.bg-body-canvas]="status() !== 'ACTIVE'"
                [class.border-hairline-light]="status() !== 'ACTIVE'"
              >
                <div class="w-8 h-8 rounded-full bg-whatsapp-green text-white flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[18px]">visibility</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5 font-bold text-xs text-ink-on-light font-mono-rate uppercase">
                    <span class="w-2 h-2 rounded-full bg-whatsapp-green animate-pulse"></span>
                    <span>Aktif Terbit (Live)</span>
                  </div>
                  <p class="text-xs text-ink-secondary mt-1 font-sans leading-relaxed">
                    Calon klien dapat langsung memilih layanan ini saat membuat reservasi slot via formulir WhatsApp publik.
                  </p>
                </div>
              </button>

              <!-- Draft Mode -->
              <button
                type="button"
                (click)="status.set('DRAFT')"
                class="p-4 rounded-[10px] border flex items-start gap-3 text-left transition-all cursor-pointer"
                [class.bg-surface-highlight]="status() === 'DRAFT'"
                [class.border-hero-canvas]="status() === 'DRAFT'"
                [class.ring-1]="status() === 'DRAFT'"
                [class.ring-hero-canvas]="status() === 'DRAFT'"
                [class.bg-body-canvas]="status() !== 'DRAFT'"
                [class.border-hairline-light]="status() !== 'DRAFT'"
              >
                <div class="w-8 h-8 rounded-full bg-surface-highlight text-ink-secondary flex items-center justify-center shrink-0 border border-hairline-light">
                  <span class="material-symbols-outlined text-[18px]">visibility_off</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-bold text-xs text-ink-on-light font-mono-rate uppercase">
                    Draf Pribadi (Hidden)
                  </span>
                  <p class="text-xs text-ink-secondary mt-1 font-sans leading-relaxed">
                    Tersimpan di workspace Anda saja. Tidak ditampilkan di katalog publik sampai Anda siap menerbitkannya.
                  </p>
                </div>
              </button>
            </div>
          </section>

          <!-- Tombol Hapus (Hanya Tampil di Mode Edit) -->
          @if (isEditMode()) {
            <div class="rounded-[10px] bg-red-50 border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div class="text-xs font-bold text-red-700 font-mono-rate uppercase">
                  Hapus Layanan Ini
                </div>
                <p class="text-xs text-ink-secondary mt-0.5 font-sans">
                  Layanan akan dihapus permanen dari katalog tarif Anda.
                </p>
              </div>
              <button
                type="button"
                (click)="handleDeleteService()"
                class="min-h-[44px] px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-xs font-bold uppercase tracking-wider font-mono-rate transition flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
              >
                <span class="material-symbols-outlined text-[16px]">delete</span>
                <span>Hapus Layanan</span>
              </button>
            </div>
          }

          <!-- BOTTOM ACTION BAR -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <a
              routerLink="/dashboard/tarif-layanan"
              class="h-11 px-5 flex items-center justify-center rounded border border-hairline-light bg-body-canvas text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer select-none"
            >
              Batal
            </a>
            <button
              type="button"
              (click)="handleSaveService()"
              [disabled]="isSubmitting() || !isFormValid()"
              class="h-11 px-6 flex items-center gap-2 rounded bg-hero-canvas text-ink-on-dark hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer shadow-none select-none"
            >
              <span class="material-symbols-outlined text-[18px] text-voltage-orange">check</span>
              <span>{{ isEditMode() ? 'Perbarui Layanan' : 'Simpan &amp; Terbitkan Layanan' }}</span>
            </button>
          </div>
        </div>

        <!-- RIGHT STREAM: STICKY LIVE PREVIEW & EDUKASI KEDAULATAN (4 COLUMNS) -->
        <div class="lg:col-span-4 sticky top-20">
          <app-worker-service-live-preview-card
            [name]="name()"
            [categoryName]="selectedCategoryName()"
            [rateType]="rateType()"
            [price]="price()"
            [durationMinutes]="durationMinutes()"
            [description]="description()"
            [status]="status()"
          />
        </div>
      </div>
    </div>
  `,
})
export class WorkerServiceEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(WorkerDashboardStore);
  private readonly homeApi = inject(HomeApiService, { optional: true });

  readonly serviceId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.serviceId());

  readonly name = signal<string>('');
  readonly categoryId = signal<string>('11111111-1111-4111-8111-111111111111');
  readonly rateType = signal<'HOURLY' | 'UNIT'>('HOURLY');
  readonly price = signal<number>(75000);
  readonly durationMinutes = signal<number>(60);
  readonly description = signal<string>('');
  readonly status = signal<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');

  readonly isSubmitting = signal<boolean>(false);
  readonly formErrorMessage = signal<string | null>(null);

  readonly categoriesList = signal<{ id: string; name: string }[]>([
    { id: '11111111-1111-4111-8111-111111111111', name: 'Servis & Pasang AC' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Sanitasi & Deep Clean' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Instalasi Listrik Presisi' },
    { id: '44444444-4444-4444-8444-444444444444', name: 'Reparasi Elektronik' },
  ]);

  readonly selectedCategoryName = computed<string>(() => {
    const cat = this.categoriesList().find((c) => c.id === this.categoryId());
    return cat ? cat.name : 'Servis & Pasang AC';
  });

  readonly isFormValid = computed<boolean>(() => {
    return (
      this.name().trim().length >= 3 &&
      this.price() > 0 &&
      this.durationMinutes() >= 15
    );
  });

  ngOnInit(): void {
    this.homeApi?.fetchPublicCategories().subscribe((cats) => {
      if (cats && cats.length > 0) {
        this.categoriesList.set(cats.map((c) => ({ id: c.id, name: c.title })));
      }
    });

    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.serviceId.set(paramId);
      this.populateExistingService(paramId);
    }
  }

  private populateExistingService(id: string): void {
    const existing = this.store.workerServices().find((s) => s.id === id);
    if (existing) {
      this.name.set(existing.name);
      if (existing.category_id) {
        this.categoryId.set(existing.category_id);
      }
      this.rateType.set(existing.rate_type || 'HOURLY');
      this.price.set(existing.price || existing.base_price || 0);
      this.durationMinutes.set(existing.duration_minutes || 60);
      this.description.set(existing.description || '');
      this.status.set(existing.status || 'ACTIVE');
    }
  }

  formatDurationText(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0 && remMin > 0) {
      return `${hours} Jam ${remMin} Menit`;
    } else if (hours > 0) {
      return `${hours} Jam`;
    }
    return `${minutes} Menit`;
  }

  toggleStatus(): void {
    this.status.set(this.status() === 'ACTIVE' ? 'DRAFT' : 'ACTIVE');
  }

  handleSaveService(): void {
    if (!this.isFormValid()) {
      this.formErrorMessage.set('Mohon lengkapi nama layanan (min. 3 karakter) dan nominal tarif.');
      return;
    }

    this.isSubmitting.set(true);
    this.formErrorMessage.set(null);

    const payload: Omit<WorkerServiceCatalogItem, 'id'> = {
      code: `SRV-${Date.now().toString(36).toUpperCase()}`,
      category_id: this.categoryId(),
      name: this.name().trim(),
      description: this.description().trim(),
      price: this.price(),
      base_price: this.price(),
      rate_type: this.rateType(),
      duration_minutes: this.durationMinutes(),
      status: this.status(),
      is_public: this.status() === 'ACTIVE',
    };

    const currentId = this.serviceId();
    if (currentId) {
      this.store.updateServiceCatalogItem(currentId, payload);
    } else {
      this.store.addNewCatalogService(payload);
    }

    this.router.navigate(['/dashboard/tarif-layanan']);
  }

  handleDeleteService(): void {
    const currentId = this.serviceId();
    if (!currentId) return;

    if (confirm('Apakah Anda yakin ingin menghapus layanan ini dari katalog?')) {
      this.store.deleteServiceCatalogItem(currentId);
      this.router.navigate(['/dashboard/tarif-layanan']);
    }
  }
}
