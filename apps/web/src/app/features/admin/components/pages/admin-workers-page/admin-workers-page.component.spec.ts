import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
      isCreateModalOpen: jest.fn().mockReturnValue(false),
      isOnboardingSubmitting: jest.fn().mockReturnValue(false),
      newlyCreatedWorker: jest.fn().mockReturnValue(null),
      totalWorkersCount: jest.fn().mockReturnValue(0),
      activeWorkersCount: jest.fn().mockReturnValue(0),
      suspendedWorkersCount: jest.fn().mockReturnValue(0),
      loadWorkers: jest.fn(),
      openCreateModal: jest.fn(),
      closeCreateModal: jest.fn(),
      submitOnboarding: jest.fn(),
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
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkersPageComponent);
    component = fixture.componentInstance;
  });

  it('harus memanggil store.loadWorkers pada saat inisialisasi', () => {
    fixture.detectChanges();
    expect(mockStore.loadWorkers).toHaveBeenCalled();
  });

  it('harus membuka modal onboarding saat tombol Tambah Mitra Baru ditekan', () => {
    fixture.detectChanges();
    const addBtn = fixture.nativeElement.querySelector('[data-testid="add-new-worker-btn"]');
    addBtn.click();
    expect(mockStore.openCreateModal).toHaveBeenCalled();
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

