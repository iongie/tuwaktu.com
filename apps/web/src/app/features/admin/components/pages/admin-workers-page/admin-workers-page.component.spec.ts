import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminWorkersPageComponent } from './admin-workers-page.component';
import { AdminWorkerStore } from '../../../services/admin-worker.store';

describe('AdminWorkersPageComponent', () => {
  let component: AdminWorkersPageComponent;
  let fixture: ComponentFixture<AdminWorkersPageComponent>;
  let mockStore: Partial<AdminWorkerStore>;

  beforeEach(async () => {
    mockStore = {
      workers: jest.fn().mockReturnValue([]),
      filteredWorkers: jest.fn().mockReturnValue([]),
      isLoading: jest.fn().mockReturnValue(false),
      errorMessage: jest.fn().mockReturnValue(null),
      feedbackMessage: jest.fn().mockReturnValue(null),
      searchQuery: jest.fn().mockReturnValue(''),
      statusFilter: jest.fn().mockReturnValue('ALL'),
      totalWorkersCount: jest.fn().mockReturnValue(0),
      activeWorkersCount: jest.fn().mockReturnValue(0),
      suspendedWorkersCount: jest.fn().mockReturnValue(0),
      loadWorkers: jest.fn(),
      toggleWorkerStatus: jest.fn(),
      setSearchQuery: jest.fn(),
      setStatusFilter: jest.fn(),
      clearError: jest.fn(),
      clearFeedback: jest.fn(),
    } as unknown as AdminWorkerStore;

    await TestBed.configureTestingModule({
      imports: [AdminWorkersPageComponent],
      providers: [
        { provide: AdminWorkerStore, useValue: mockStore },
        provideRouter([{ path: '**', component: AdminWorkersPageComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkersPageComponent);
    component = fixture.componentInstance;
  });

  it('harus memanggil store.loadWorkers pada saat inisialisasi', () => {
    fixture.detectChanges();
    expect(mockStore.loadWorkers).toHaveBeenCalled();
  });

  it('harus memiliki routerLink ke /admin/workers/new pada tombol Tambah Mitra Baru', () => {
    fixture.detectChanges();
    const addBtn = fixture.nativeElement.querySelector('[data-testid="add-new-worker-btn"]');
    expect(addBtn.getAttribute('routerLink') || addBtn.getAttribute('href')).toContain('/admin/workers/new');
  });

  it('harus bernavigasi ke /admin/workers/new saat navigateToAddWorker dipanggil', () => {
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.navigateToAddWorker();
    expect(navSpy).toHaveBeenCalledWith(['/admin/workers/new']);
  });

  it('harus merender banner error merah saat store.errorMessage memiliki nilai', () => {
    const errorMsg = 'Sesi login telah berakhir atau otentikasi tidak valid. Silakan login kembali.';
    (mockStore.errorMessage as jest.Mock).mockReturnValue(errorMsg);
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('[data-testid="admin-error-banner"]');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.textContent).toContain('Kendala Koneksi atau Otentikasi API');
    expect(errorBanner.textContent).toContain(errorMsg);

    // Klik tombol Coba Lagi
    const retryBtn = fixture.nativeElement.querySelector('[data-testid="admin-error-retry-btn"]');
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    expect(mockStore.loadWorkers).toHaveBeenCalled();

    // Klik tombol Tutup
    const dismissBtn = fixture.nativeElement.querySelector('[data-testid="admin-error-dismiss-btn"]');
    expect(dismissBtn).toBeTruthy();
    dismissBtn.click();
    expect(mockStore.clearError).toHaveBeenCalled();
  });

  it('tidak boleh merender banner error merah saat store.errorMessage bernilai null', () => {
    (mockStore.errorMessage as jest.Mock).mockReturnValue(null);
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('[data-testid="admin-error-banner"]');
    expect(errorBanner).toBeNull();
  });

  it('harus merender loading skeleton tabel saat store.isLoading bernilai true', () => {
    (mockStore.isLoading as jest.Mock).mockReturnValue(true);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('[data-testid="admin-table-skeleton"]');
    expect(skeleton).toBeTruthy();

    const table = fixture.nativeElement.querySelector('app-admin-workers-table');
    expect(table).toBeNull();
  });

  it('harus merender komponen app-admin-workers-table saat store.isLoading bernilai false', () => {
    (mockStore.isLoading as jest.Mock).mockReturnValue(false);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('[data-testid="admin-table-skeleton"]');
    expect(skeleton).toBeNull();

    const table = fixture.nativeElement.querySelector('app-admin-workers-table');
    expect(table).toBeTruthy();
  });
});

