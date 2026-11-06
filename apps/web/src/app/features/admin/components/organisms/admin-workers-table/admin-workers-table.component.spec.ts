import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminWorkersTableComponent } from './admin-workers-table.component';
import { AdminWorkerListItem } from '../../../models/admin-worker.model';

describe('AdminWorkersTableComponent', () => {
  let component: AdminWorkersTableComponent;
  let fixture: ComponentFixture<AdminWorkersTableComponent>;

  const sampleWorkers: AdminWorkerListItem[] = [
    {
      account_id: 'acc-1',
      worker_id: 'wrk-1',
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      bio: 'Teknisi AC',
      zone: 'Jakarta Selatan',
      base_price: 75000,
      rate_type: 'HOURLY',
      avatar_url: '',
      rating: 4.9,
      review_count: 10,
      phone_number: '6281234567890',
      whatsapp_number: '6281234567890',
      email: 'budi@tuwaktu.com',
      role: 'WORKER',
      account_status: 'ACTIVE',
      must_change_password: false,
      created_at: new Date().toISOString(),
    },
    {
      account_id: 'acc-2',
      worker_id: 'wrk-2',
      slug: 'siti-aminah',
      name: 'Siti Aminah',
      bio: 'Deep Cleaning',
      zone: 'Tangerang Selatan',
      base_price: 120000,
      rate_type: 'UNIT',
      avatar_url: '',
      rating: 4.8,
      review_count: 5,
      phone_number: '6281987654321',
      whatsapp_number: '6281987654321',
      email: 'siti@tuwaktu.com',
      role: 'WORKER',
      account_status: 'SUSPENDED',
      must_change_password: false,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkersTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkersTableComponent);
    component = fixture.componentInstance;
  });

  it('harus merender baris pekerja saat daftar workers tidak kosong', () => {
    fixture.componentRef.setInput('workers', sampleWorkers);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Budi Santoso');
    expect(fixture.nativeElement.textContent).toContain('Siti Aminah');

    const manageRatesBtn = fixture.nativeElement.querySelector('[data-testid="manage-rates-btn-budi-santoso"]');
    expect(manageRatesBtn).toBeTruthy();
    expect(manageRatesBtn.getAttribute('href')).toContain('/dashboard/tarif-layanan');
  });

  it('harus memancarkan toggleStatusClick saat tombol Tangguhkan atau Aktifkan diklik', () => {
    const toggleSpy = jest.spyOn(component.toggleStatusClick, 'emit');
    fixture.componentRef.setInput('workers', sampleWorkers);
    fixture.detectChanges();

    const suspendBtn = fixture.nativeElement.querySelector('[data-testid="suspend-btn-budi-santoso"]');
    expect(suspendBtn).toBeTruthy();
    suspendBtn.click();

    expect(toggleSpy).toHaveBeenCalledWith(sampleWorkers[0]);
  });

  it('harus merender empty state saat workers kosong dan memicu addWorkerClick', () => {
    const addSpy = jest.spyOn(component.addWorkerClick, 'emit');
    fixture.componentRef.setInput('workers', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-testid="empty-workers-state"]');
    expect(emptyState).toBeTruthy();

    const addBtn = fixture.nativeElement.querySelector('[data-testid="empty-add-worker-btn"]');
    addBtn.click();

    expect(addSpy).toHaveBeenCalled();
  });
});

