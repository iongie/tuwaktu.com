import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeFaqItemComponent } from '../../molecules/home-faq-item/home-faq-item.component';
import { FaqItem } from '../../../models/home.model';

@Component({
  selector: 'app-home-faq-section',
  standalone: true,
  imports: [CommonModule, HomeFaqItemComponent],
  template: `
    <section
      id="faq"
      class="w-full bg-surface-container-low py-12 sm:py-16 border-b border-hairline-subtle"
      aria-labelledby="faq-heading"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <h2
            id="faq-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Pertanyaan yang Sering Diajukan
          </h2>

          <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
            Jawaban seputar sistem 0% komisi, pemesanan via WhatsApp, dan cara kerja jadwal teknisi.
          </p>
        </div>

        <!-- Accordion Items List -->
        <div class="space-y-3">
          @for (faq of faqs; track faq.id) {
            <app-home-faq-item
              [faq]="faq"
              [isOpen]="openFaqId() === faq.id"
              (toggleItem)="toggleFaq(faq.id)"
            />
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFaqSectionComponent {
  readonly openFaqId = signal<string | null>('faq-1');

  readonly faqs: FaqItem[] = [
    {
      id: 'faq-1',
      question: 'Apakah Tuwaktu benar-benar tidak memotong komisi sama sekali?',
      answer:
        'Ya, benar. Seluruh pembayaran jasa dari klien diterima langsung oleh teknisi tanpa potongan komisi persentase, potongan saldo, atau biaya langganan wajib.',
      category: 'Komisi',
    },
    {
      id: 'faq-2',
      question: 'Bagaimana cara konfirmasi pesanan lewat WhatsApp?',
      answer:
        'Setelah Anda memilih layanan, tanggal, dan jam yang tersedia, sistem akan menyiapkan pesan pesanan lengkap dengan kode booking. Anda tinggal menekan tombol untuk membuka WhatsApp dan mengirimnya langsung ke nomor teknisi.',
      category: 'Reservasi',
    },
    {
      id: 'faq-3',
      question: 'Mengapa ada jeda perjalanan 60-90 menit antar jadwal?',
      answer:
        'Jeda waktu otomatis di antara dua jadwal memberi waktu bagi teknisi untuk membereskan alat, istirahat sejenak, dan menempuh perjalanan agar datang tepat waktu ke lokasi berikutnya.',
      category: 'Logistik',
    },
    {
      id: 'faq-4',
      question: 'Bagaimana proses verifikasi teknisi di Tuwaktu?',
      answer:
        'Setiap teknisi melewati pengecekan identitas KTP, lokasi pangkalan kerja yang jelas, serta kesesuaian keahlian dan perlengkapan kerja sebelum profil dan daftar layanannya tampil di halaman publik.',
      category: 'Verifikasi',
    },
    {
      id: 'faq-5',
      question: 'Apakah ada biaya pendaftaran atau pemesanan bagi klien?',
      answer:
        'Gratis. Klien tidak dikenakan biaya aplikasi apa pun saat mencari teknisi dan memesan jadwal. Anda cukup membayar biaya jasa dan ongkos transport (jika di luar area gratis) langsung ke teknisi.',
      category: 'Biaya',
    },
  ];

  toggleFaq(id: string): void {
    this.openFaqId.update((current) => (current === id ? null : id));
  }
}
