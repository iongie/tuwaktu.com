import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../services/worker-dashboard.store';

export type BoostPackageType = 'FLASH_24H' | 'WEEKEND_72H' | 'WEEKLY_7D';

export interface BoostPackageOption {
  readonly id: BoostPackageType;
  readonly name: string;
  readonly badge: string;
  readonly priceDisplay: string;
  readonly durationText: string;
  readonly multiplierText: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly isPopular?: boolean;
}

@Component({
  selector: 'app-worker-dashboard-boost',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-dashboard-boost.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardBoostComponent {
  readonly store = inject(WorkerDashboardStore);

  readonly selectedBoostPackage = signal<BoostPackageType>('WEEKEND_72H');

  readonly boostPackages: readonly BoostPackageOption[] = [
    {
      id: 'FLASH_24H',
      name: 'Boost Kilat 24 Jam',
      badge: 'Isi Slot Hari Ini',
      priceDisplay: 'Rp 9.000',
      durationText: '24 Jam Penuh',
      multiplierText: '2.0x Visibilitas',
      description: 'Mendorong profil Anda seketika untuk mendapatkan pesanan mendesak hari ini.',
      highlights: [
        'Prioritas radar pencarian kilat',
        'Lencana "Siap Order Hari Ini"',
        'Proteksi batas radius basecamp aktif',
      ],
      isPopular: false,
    },
    {
      id: 'WEEKEND_72H',
      name: 'Boost Akhir Pekan',
      badge: 'Paling Populer',
      priceDisplay: 'Rp 19.000',
      durationText: '72 Jam (Jumat - Minggu)',
      multiplierText: '3.5x Visibilitas',
      description: 'Maksimalkan pendapatan saat volume pencarian jasa rumah tangga mencapai puncaknya.',
      highlights: [
        'Prioritas posisi 3 teratas radar lokal',
        'Notifikasi WhatsApp prioritas tinggi',
        'Buffer transit 60-90 menit tetap terjamin',
        'Jangkauan calon klien 3x lebih luas',
      ],
      isPopular: true,
    },
    {
      id: 'WEEKLY_7D',
      name: 'Boost Mingguan',
      badge: 'Dampak Maksimal',
      priceDisplay: 'Rp 39.000',
      durationText: '7 Hari Berturut-turut',
      multiplierText: '5.0x Visibilitas',
      description: 'Menjaga jadwal pemesanan Anda penuh selama satu pekan penuh dengan eksposur stabil.',
      highlights: [
        'Eksklusif slot rekomendasi utama kecamatan',
        'Lonjakan impresi pencarian hingga +180%',
        'Lencana reputasi emas di halaman hasil pencarian',
        'Analisis metrik konversi klik langsung',
      ],
      isPopular: false,
    },
  ];

  readonly activePackageDetails = computed(() => {
    const selected = this.selectedBoostPackage();
    return this.boostPackages.find((pkg) => pkg.id === selected) || this.boostPackages[1];
  });

  selectBoostPackage(packageId: BoostPackageType): void {
    this.selectedBoostPackage.set(packageId);
  }

  activateBoost(): void {
    this.store.activateBoost(this.selectedBoostPackage());
  }

  toggleRadarBoost(): void {
    this.store.toggleBoostStatus();
  }
}

