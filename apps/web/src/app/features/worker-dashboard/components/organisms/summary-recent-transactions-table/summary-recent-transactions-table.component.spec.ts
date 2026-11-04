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

  it('harus merender 4 baris data transaksi klien', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bu Ratna K.');
    expect(el.textContent).toContain('Pak Dimas Arya');
    expect(el.textContent).toContain('Clara Veronica');
    expect(el.textContent).toContain('Hendra Wijaya');
    expect(el.textContent).toContain('Rp 280.000');
    expect(el.textContent).toContain('Rp 216.000');
    expect(el.textContent).toContain('Rp 360.000');
    expect(el.textContent).toContain('Rp 180.000');
  });

  it('harus memicu fungsi downloadCsv saat tombol diklik', () => {
    const spy = jest.spyOn(component, 'downloadCsv');
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    button.click();
    expect(spy).toHaveBeenCalled();
  });
});
