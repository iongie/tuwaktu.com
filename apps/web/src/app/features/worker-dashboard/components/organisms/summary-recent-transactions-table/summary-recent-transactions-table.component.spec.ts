import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryRecentTransactionsTableComponent } from './summary-recent-transactions-table.component';

describe('SummaryRecentTransactionsTableComponent', () => {
  let fixture: ComponentFixture<SummaryRecentTransactionsTableComponent>;
  let component: SummaryRecentTransactionsTableComponent;

  beforeEach(async () => {
    window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();

    await TestBed.configureTestingModule({
      imports: [SummaryRecentTransactionsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryRecentTransactionsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryRecentTransactionsTableComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender header riwayat aktivitas dan tombol unduh CSV', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Riwayat Aktivitas & Transaksi Terkini');
    expect(el.textContent).toContain('Pencatatan langsung tanpa penahanan dana saldo');
    expect(el.textContent).toContain('Unduh Rekap CSV');
  });

  it('harus merender empty state saat belum ada riwayat transaksi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Belum Ada Riwayat Transaksi');
    expect(el.textContent).toContain('Pencatatan riil pemesanan dan penerimaan biaya jasa');
  });

  it('harus merender baris data transaksi klien saat data transaksi tersedia', () => {
    component.transactions.set([
      {
        id: 'tx-01',
        dateTime: '24 Okt 2024 • 08:30',
        clientName: 'Ratna Kusuma',
        clientArea: 'Tebet Barat 1.8 Km',
        serviceName: 'Deep Cleaning',
        durationHours: '3.0 Jam',
        totalReceived: 'Rp 280.000',
        status: 'Selesai',
      },
    ]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ratna Kusuma');
    expect(el.textContent).toContain('Deep Cleaning');
    expect(el.textContent).toContain('Rp 280.000');
    expect(el.textContent).toContain('Selesai');
  });

  it('harus memicu fungsi downloadCsv saat tombol diklik dan ada transaksi', () => {
    component.transactions.set([
      {
        id: 'tx-01',
        dateTime: '24 Okt 2024 • 08:30',
        clientName: 'Ratna Kusuma',
        clientArea: 'Tebet Barat 1.8 Km',
        serviceName: 'Deep Cleaning',
        durationHours: '3.0 Jam',
        totalReceived: 'Rp 280.000',
        status: 'Selesai',
      },
    ]);
    fixture.detectChanges();

    const spy = jest.spyOn(component, 'downloadCsv');
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    button.click();
    expect(spy).toHaveBeenCalled();
  });
});
