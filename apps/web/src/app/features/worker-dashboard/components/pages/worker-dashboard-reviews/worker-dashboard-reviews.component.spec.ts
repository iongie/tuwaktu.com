import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerDashboardReviewsComponent } from './worker-dashboard-reviews.component';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardReviewRecord } from '../../../models/worker-profile.model';

describe('WorkerDashboardReviewsComponent', () => {
  let component: WorkerDashboardReviewsComponent;
  let fixture: ComponentFixture<WorkerDashboardReviewsComponent>;

  const mockReviews: WorkerDashboardReviewRecord[] = [
    {
      id: 'rev-01',
      booking_code: 'BK-101',
      client_name: 'Budi Santoso',
      is_anonymous: false,
      rating: 5,
      comment: 'Sangat puas dengan hasilnya.',
      service_name: 'Servis AC',
      booking_date: '2026-11-01T08:00:00Z',
      created_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'rev-02',
      booking_code: 'BK-102',
      client_name: 'Ahmad Fauzi',
      is_anonymous: true,
      rating: 4,
      comment: 'Bagus dan ramah.',
      service_name: 'Cuci AC',
      booking_date: '2026-11-02T09:00:00Z',
      created_at: '2026-11-02T11:00:00Z',
    },
  ];

  const mockApiService = {
    fetchWorkerReviews: jest.fn().mockReturnValue(
      of({
        success: true,
        message: 'OK',
        data: { reviews: mockReviews, total: 2 },
        error: null,
      })
    ),
  };

  const mockStore = {
    workerRecordId: jest.fn().mockReturnValue('worker-123'),
    workerSlug: jest.fn().mockReturnValue('budi-santoso'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardReviewsComponent],
      providers: [
        { provide: WorkerDashboardApiService, useValue: mockApiService },
        { provide: WorkerDashboardStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance WorkerDashboardReviewsComponent dan memuat daftar review', () => {
    expect(component).toBeTruthy();
    expect(mockApiService.fetchWorkerReviews).toHaveBeenCalledWith('worker-123', 50, 0);
    expect(component.reviews().length).toBe(2);
    expect(component.averageRating()).toBe('4.5');
    expect(component.fiveStarPercentage()).toBe(50);
  });

  it('harus memfilter ulasan berdasarkan bintang', () => {
    component.selectedStarFilter.set(5);
    expect(component.filteredReviews().length).toBe(1);
    expect(component.filteredReviews()[0].rating).toBe(5);

    component.selectedStarFilter.set(4);
    expect(component.filteredReviews().length).toBe(1);
    expect(component.filteredReviews()[0].rating).toBe(4);

    component.selectedStarFilter.set(0);
    expect(component.filteredReviews().length).toBe(2);
  });
});

