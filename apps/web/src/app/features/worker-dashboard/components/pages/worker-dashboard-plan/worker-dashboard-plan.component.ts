import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

export type PlanTierType = 'STARTER' | 'PRO' | 'FLEET';

export interface PlanFeatureItem {
  readonly text: string;
  readonly isHighlighted?: boolean;
}

export interface PlanTierDefinition {
  readonly id: PlanTierType;
  readonly name: string;
  readonly badge: string;
  readonly priceDisplay: string;
  readonly priceSubtext: string;
  readonly description: string;
  readonly features: readonly PlanFeatureItem[];
  readonly isPopular?: boolean;
}

@Component({
  selector: 'app-worker-dashboard-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-dashboard-plan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardPlanComponent {
  readonly store = inject(WorkerDashboardStore);

  readonly planTiers: readonly PlanTierDefinition[] = [
    {
      id: 'STARTER',
      name: 'Paket Starter',
      badge: 'Bebas Komisi Dasar',
      priceDisplay: 'Rp 0',
      priceSubtext: 'Bebas biaya selamanya',
      description: 'Ideal untuk teknisi mandiri pemula yang baru memulai layanan jasa online.',
      features: [
        { text: '100% Bebas potongan komisi dari pesanan' },
        { text: 'Tautan pemesanan mandiri publik (tuwaktu.com/:slug)' },
        { text: 'Integrasi notifikasi pesanan via WhatsApp langsung' },
        { text: 'Kapasitas penerimaan order: hingga 20 booking per bulan' },
        { text: 'Radius jangkauan basecamp dasar: maksimal 10 Km' },
      ],
      isPopular: false,
    },
    {
      id: 'PRO',
      name: 'Paket Mandiri Pro',
      badge: 'Akses Lengkap • Rekomendasi',
      priceDisplay: 'Rp 49.000',
      priceSubtext: 'per bulan (atau Rp 490.000 per tahun)',
      description: 'Pilihan utama profesional mandiri untuk memaksimalkan jadwal kerja dan visibilitas radar lokal.',
      features: [
        { text: '100% Bebas potongan komisi dari pesanan', isHighlighted: true },
        { text: 'Prioritas ranking teratas di radar pencarian klien sekitar', isHighlighted: true },
        { text: 'Lencana verifikasi resmi "VERIFIED PRO" di profil publik', isHighlighted: true },
        { text: 'Radius operasional fleksibel hingga 35 Km tanpa batas kuota' },
        { text: 'Kalkulator logistik otomatis (ongkos bensin per kilometer)' },
        { text: 'Buffer transit otomatis 60-90 menit anti-kelelahan' },
        { text: 'Riwayat data pemesanan terperinci & analitik bulanan' },
      ],
      isPopular: true,
    },
    {
      id: 'FLEET',
      name: 'Paket Bengkel & Tim',
      badge: 'Skala Usaha Kolektif',
      priceDisplay: 'Rp 149.000',
      priceSubtext: 'per bulan untuk tim & studio',
      description: 'Dirancang bagi pangkalan servis, bengkel, atau kelompok teknisi dengan banyak anggota lapangan.',
      features: [
        { text: '100% Bebas potongan komisi pesanan tim' },
        { text: 'Pengelolaan multi-operator dan cabang basecamp' },
        { text: 'Dispatch WhatsApp otomatis ke personil bertugas' },
        { text: 'Prioritas penanganan bantuan operator 24/7' },
        { text: 'Ekspor laporan finansial & riwayat performa tim' },
      ],
      isPopular: false,
    },
  ];

  selectPlanTier(tierId: PlanTierType): void {
    this.store.selectPlanTier(tierId);
  }
}

