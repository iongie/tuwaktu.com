import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClientReviewPageComponent } from './client-review-page.component';
import { ClientReviewApiService } from '../../../services/client-review-api.service';
import { ReviewInvitationDetail } from '../../../models/client-review.model';

describe('ClientReviewPageComponent', () => {
  let component: ClientReviewPageComponent;
  let fixture: ComponentFixture<ClientReviewPageComponent>;

  const mockInvitation: ReviewInvitationDetail = {
    booking_code: 'BK-TEST-777',
    worker_name: 'Budi Santoso',
    worker_slug: 'budi-santoso',
    worker_zone: 'Jakarta Barat',
    service_name: 'Cuci AC Bersih',
    booking_date: '2026-11-10T10:00:00Z',
    client_name: 'Rian Ardianto',
    is_reviewed: false,
  };

  const mockReviewApi = {
    fetchReviewInvitation: jest.fn(),
    submitClientReview: jest.fn(),
  };

  const mockActivatedRoute = {
    snapshot: {
      params: { bookingCode: 'BK-TEST-777' },
      queryParams: { token: 'valid-secret-token' },
    },
  };

  beforeEach(async () => {
    mockReviewApi.fetchReviewInvitation.mockReturnValue(
      of({ success: true, message: 'OK', data: mockInvitation, error: null })
    );

    await TestBed.configureTestingModule({
      imports: [ClientReviewPageComponent],
      providers: [
        { provide: ClientReviewApiService, useValue: mockReviewApi },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientReviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus memuat data invitation saat inisialisasi', () => {
    expect(component).toBeTruthy();
    expect(mockReviewApi.fetchReviewInvitation).toHaveBeenCalledWith('BK-TEST-777', 'valid-secret-token');
    expect(component.isLoading()).toBe(false);
    expect(component.invitation()?.client_name).toBe('Rian Ardianto');
  });

  it('harus menampilkan pesan error jika API mengembalikan error token tidak valid', () => {
    mockReviewApi.fetchReviewInvitation.mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'Token tautan ulasan tidak valid atau telah kadaluarsa' },
      }))
    );

    component.loadInvitation();
    expect(component.pageError()).toContain('Token tautan ulasan tidak valid');
    expect(component.invitation()).toBeNull();
  });

  it('harus berhasil submit review dan mengubah state isSubmitted ke true', () => {
    mockReviewApi.submitClientReview.mockReturnValue(
      of({ success: true, message: 'Sukses', data: {}, error: null })
    );

    component.onSubmitReview({
      rating: 5,
      comment: 'Pelayanan sangat memuaskan!',
      isAnonymous: false,
    });

    expect(mockReviewApi.submitClientReview).toHaveBeenCalledWith(
      expect.objectContaining({
        booking_code: 'BK-TEST-777',
        token: 'valid-secret-token',
        rating: 5,
        comment: 'Pelayanan sangat memuaskan!',
      })
    );
    expect(component.isSubmitted()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });
});
