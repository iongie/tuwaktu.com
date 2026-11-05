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
      class="w-full bg-surface-container-low py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="faq-heading"
    >
      <div class="max-w-4xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto space-y-space-xs">
          <span
            class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider inline-block"
          >
            Pusat Pengetahuan
          </span>

          <h2
            id="faq-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Pertanyaan yang Sering Diajukan
          </h2>

          <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
            Transparansi penuh mengenai protokol kedaulatan 0% komisi, privasi WhatsApp, dan sistem penjadwalan mandiri.
          </p>
        </div>

        <!-- Accordion Items List -->
        <div class="space-y-space-sm">
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
        'Ya, 100% benar. Tuwaktu beroperasi dengan protokol kedaulatan pekerja mandiri. Seluruh pembayaran dari klien diserahkan langsung kepada teknisi tanpa potongan komisi persentase, potongan saldo, atau biaya langganan paksa.',
      category: 'Komisi',
    },
    {
      id: 'faq-2',
      question: 'Bagaimana alur konfirmasi reservasi via WhatsApp bekerja?',
      answer:
        'Setelah klien memilih paket layanan, tanggal, dan slot jam yang tersedia, sistem Tuwaktu akan menyusun format pesan pemesanan yang rapi beserta kode reservasi unik. Klien cukup menekan tombol untuk membuka WhatsApp dan mengirim pesan langsung ke nomor asli teknisi.',
      category: 'Reservasi',
    },
    {
      id: 'faq-3',
      question: 'Mengapa fitur buffer transit 60-90 menit sangat penting?',
      answer:
        'Buffer transit adalah jeda waktu yang otomatis dikunci sistem di antara dua slot reservasi. Jeda ini memberikan waktu realistis bagi mitra untuk membersihkan peralatan, beristirahat sejenak, dan menempuh perjalanan tanpa risiko terlambat karena kemacetan lalu lintas.',
      category: 'Logistik',
    },
    {
      id: 'faq-4',
      question: 'Bagaimana standar verifikasi teknisi dan mitra mandiri?',
      answer:
        'Setiap mitra mandiri melewati proses verifikasi identitas resmi (KTP), penetapan pangkalan operasional yang valid, serta kesesuaian kategori keahlian dan kepemilikan alat kerja sebelum profil dan katalog layanan dipublikasikan secara resmi.',
      category: 'Verifikasi',
    },
    {
      id: 'faq-5',
      question: 'Apakah ada biaya pendaftaran atau pemesanan bagi klien?',
      answer:
        'Tidak ada biaya apa pun bagi klien untuk mencari spesialis dan memesan jadwal di Tuwaktu. Klien hanya membayar biaya jasa dan ongkos kirim (jika di luar radius gratis) langsung kepada mitra teknisi yang bertugas.',
      category: 'Biaya',
    },
  ];

  toggleFaq(id: string): void {
    this.openFaqId.update((current) => (current === id ? null : id));
  }
}
