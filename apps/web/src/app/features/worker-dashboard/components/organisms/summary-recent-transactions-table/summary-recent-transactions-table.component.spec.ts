import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryRecentTransactionsTableComponent } from './summary-recent-transactions-table.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerBookingRecord } from '../../../models/worker-profile.model';
import { of } from 'rxjs';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('SummaryRecentTransactionsTableComponent', () => {
  let fixture: ComponentFixture<SummaryRecentTransactionsTableComponent>;
  let component: SummaryRecentTransactionsTableComponent;
  let store: WorkerDashboardStore;

  const mockBookings: WorkerBookingRecord[] = [
    {
      id: 'bkg-01',
      booking_code: 'BK-001',
      worker_id: 'worker-1',
      service_id: 'srv-1',
      service_name: 'Deep Cleaning',
      duration_minutes: 180,
      client_name: 'Ratna Kusuma',
      client_phone: '081234567890',
      location: 'Tebet Barat 1.8 Km',
      zone: 'Jakarta Selatan',
      booking_date: '2026-10-24T08:30:00Z',
      start_time: '2026-10-24T08:30:00Z',
      total_price: 280000,
      status: 'COMPLETED',
      created_at: '2026-10-24T08:00:00Z',
    },
    {
      id: 'bkg-02',
      booking_code: 'BK-002',
      worker_id: 'worker-1',
      service_id: 'srv-2',
      service_name: 'Cuci AC Standar',
      duration_minutes: 60,
      client_name: 'Bambang Sudirman',
      client_phone: '081999888777',
      location: 'Kebayoran Baru',
      zone: 'Jakarta Selatan',
      booking_date: '2026-10-25T10:00:00Z',
      start_time: '2026-10-25T10:00:00Z',
      total_price: 150000,
      status: 'PENDING_WA',
      created_at: '2026-10-25T09:00:00Z',
    },
  ];

  beforeEach(async () => {
    window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();

    const mockApi = {
      fetchWorkerProfile: jest.fn().mockReturnValue(of({ success: true, data: {} })),
      fetchWorkerSchedules: jest.fn().mockReturnValue(of({ success: true, data: [] })),
      fetchWorkerBookings: jest.fn().mockReturnValue(of({ success: true, data: mockBookings })),
      updateBookingStatus: jest.fn().mockReturnValue(of({
        success: true,
        data: { ...mockBookings[1], status: 'CONFIRMED' },
      })),
    };

    await TestBed.configureTestingModule({
      imports: [SummaryRecentTransactionsTableComponent],
      providers: [
        WorkerDashboardStore,
        { provide: WorkerDashboardApiService, useValue: mockApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryRecentTransactionsTableComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    store.workerRecordId.set('worker-1');
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryRecentTransactionsTableComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender header riwayat aktivitas, bilah filter, dan tombol unduh CSV', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Riwayat Aktivitas & Transaksi Terkini');
    expect(el.textContent).toContain('Unduh Rekap CSV');
    expect(el.textContent).toContain('Semua');
    expect(el.textContent).toContain('Menunggu WA');
    expect(el.textContent).toContain('Terjadwal');
    expect(el.textContent).toContain('Selesai');
  });

  it('harus merender empty state saat belum ada riwayat transaksi', () => {
    store.workerBookings.set([]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Belum Ada Riwayat Pemesanan');
    expect(el.textContent).toContain('Pencatatan riil pemesanan mandiri oleh pelanggan');
  });

  it('harus merender baris data pesanan klien saat data riil tersedia di store', () => {
    store.workerBookings.set(mockBookings);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ratna Kusuma');
    expect(el.textContent).toContain('BK-001');
    expect(el.textContent).toContain('Deep Cleaning');
    expect(el.textContent).toContain('280.000');
    expect(el.textContent).toContain('Selesai');

    expect(el.textContent).toContain('Bambang Sudirman');
    expect(el.textContent).toContain('BK-002');
    expect(el.textContent).toContain('Cuci AC Standar');
    expect(el.textContent).toContain('150.000');
    expect(el.textContent).toContain('Menunggu WA');
  });

  it('harus memfilter pesanan saat tab filter status dipilih', () => {
    store.workerBookings.set(mockBookings);
    fixture.detectChanges();

    store.setBookingFilterStatus('PENDING_WA');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bambang Sudirman');
    expect(el.textContent).not.toContain('Ratna Kusuma');
  });

  it('harus memfilter pesanan berdasarkan pencarian nama atau kode reservasi', () => {
    store.workerBookings.set(mockBookings);
    fixture.detectChanges();

    store.setBookingSearchQuery('BK-001');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ratna Kusuma');
    expect(el.textContent).not.toContain('Bambang Sudirman');
  });

  it('harus memicu updateBookingStatus saat tombol aksi cepat diklik', () => {
    store.workerBookings.set(mockBookings);
    fixture.detectChanges();

    const updateSpy = jest.spyOn(store, 'updateBookingStatus');
    const konfirmasiBtn = fixture.nativeElement.querySelector('button[title="Tandai pesanan telah terkonfirmasi"]');
    expect(konfirmasiBtn).toBeTruthy();
    konfirmasiBtn.click();

    expect(updateSpy).toHaveBeenCalledWith('bkg-02', 'CONFIRMED');
  });

  it('harus memicu fungsi downloadCsv saat tombol diklik dan ada transaksi', () => {
    store.workerBookings.set(mockBookings);
    fixture.detectChanges();

    const spy = jest.spyOn(component, 'downloadCsv');
    const button = fixture.nativeElement.querySelector('button[aria-label="Unduh Rekap CSV Transaksi"]');
    expect(button).toBeTruthy();
    button.click();
    expect(spy).toHaveBeenCalled();
  });
});
