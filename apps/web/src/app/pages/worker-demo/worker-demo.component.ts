import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { WorkerService } from '../../core/services/worker.service';
import {
  CreateBookingRequest,
  PublicBookingResponse,
  PublicService,
  PublicWorkerProfile,
} from '../../core/models/api.model';
import { APP_ENVIRONMENT } from '../../../environments/environment.model';

@Component({
  selector: 'app-worker-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-demo.component.html',
  styleUrl: './worker-demo.component.css',
})
export class WorkerDemoComponent implements OnInit {
  private readonly workerService = inject(WorkerService);
  private readonly titleService = inject(Title);
  readonly env = inject(APP_ENVIRONMENT);

  // Search state
  searchSlug = signal<string>('budi-santoso');
  loadingWorker = signal<boolean>(false);
  workerError = signal<string | null>(null);
  worker = signal<PublicWorkerProfile | null>(null);

  // Selected service
  selectedService = signal<PublicService | null>(null);

  // Booking form state
  clientName = '';
  clientPhone = '';
  clientEmail = '';
  clientLocation = 'Jl. Kemang Raya No. 15, Jakarta Selatan';
  clientZone = 'Jakarta Selatan';
  bookingDate = '';
  notes = 'Mohon konfirmasi 30 menit sebelum kedatangan';

  submittingBooking = signal<boolean>(false);
  bookingError = signal<string | null>(null);
  bookingSuccess = signal<PublicBookingResponse | null>(null);

  ngOnInit(): void {
    this.titleService.setTitle(this.env.appTitle);

    // Default tomorrow at 10:00 local time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    this.bookingDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;

    this.loadWorker();
  }

  loadWorker(): void {
    const slug = this.searchSlug().trim();
    if (!slug) {
      this.workerError.set('Silakan masukkan slug pekerja');
      return;
    }

    this.loadingWorker.set(true);
    this.workerError.set(null);
    this.bookingSuccess.set(null);
    this.bookingError.set(null);

    this.workerService.getWorkerProfile(slug).subscribe({
      next: (res) => {
        this.loadingWorker.set(false);
        if (res.success && res.data) {
          this.worker.set(res.data);
          this.clientZone = res.data.zone;
          if (res.data.services && res.data.services.length > 0) {
            this.selectedService.set(res.data.services[0]);
          } else {
            this.selectedService.set(null);
          }
        } else {
          this.workerError.set(res.message || 'Pekerja tidak ditemukan');
          this.worker.set(null);
        }
      },
      error: (err) => {
        this.loadingWorker.set(false);
        const errMsg =
          err.status === 0
            ? 'Gagal menghubungi server API. Pastikan backend aktif.'
            : err?.error?.message ||
              (err.status === 404
                ? 'Pekerja tidak ditemukan'
                : 'Gagal memuat profil pekerja');
        this.workerError.set(errMsg);
        this.worker.set(null);
      },
    });
  }

  selectService(service: PublicService): void {
    this.selectedService.set(service);
    this.bookingSuccess.set(null);
    this.bookingError.set(null);
  }

  submitBooking(): void {
    const currentWorker = this.worker();
    const service = this.selectedService();

    if (!currentWorker || !service) {
      this.bookingError.set('Silakan pilih pekerja dan layanan terlebih dahulu');
      return;
    }

    if (!this.clientName.trim()) {
      this.bookingError.set('Nama klien (client_name) wajib diisi');
      return;
    }

    if (!this.clientLocation.trim() && !this.clientZone.trim()) {
      this.bookingError.set('Lokasi atau zona pemesan wajib diisi');
      return;
    }

    this.submittingBooking.set(true);
    this.bookingError.set(null);
    this.bookingSuccess.set(null);

    let formattedBookingDate: string | undefined;
    if (this.bookingDate) {
      const parsedDate = new Date(this.bookingDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedBookingDate = parsedDate.toISOString();
      }
    }

    const payload: CreateBookingRequest = {
      worker_id: currentWorker.id,
      worker_slug: currentWorker.slug,
      service_id: service.id,
      client_name: this.clientName.trim(),
      client_phone: this.clientPhone.trim(),
      client_email: this.clientEmail.trim(),
      location: this.clientLocation.trim(),
      zone: this.clientZone.trim(),
      booking_date: formattedBookingDate,
      notes: this.notes.trim(),
    };

    this.workerService.createBooking(payload).subscribe({
      next: (res) => {
        this.submittingBooking.set(false);
        if (res.success && res.data) {
          this.bookingSuccess.set(res.data);
        } else {
          this.bookingError.set(res.message || 'Gagal memproses pesanan booking');
        }
      },
      error: (err) => {
        this.submittingBooking.set(false);
        const msg =
          err.status === 0
            ? 'Gagal menghubungi server API. Pastikan backend aktif.'
            : err?.error?.message ||
              (err?.error?.error
                ? `${err.error.message}: ${err.error.error}`
                : 'Gagal membuat pesanan booking');
        this.bookingError.set(msg);
      },
    });
  }

  resetBookingForm(): void {
    this.bookingSuccess.set(null);
    this.bookingError.set(null);
    this.clientName = '';
    this.clientPhone = '';
    this.clientEmail = '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);
  }
}
