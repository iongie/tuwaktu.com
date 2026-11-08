import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientReviewFormComponent } from './client-review-form.component';
import { ReviewInvitationDetail } from '../../models/client-review.model';

describe('ClientReviewFormComponent', () => {
  let component: ClientReviewFormComponent;
  let fixture: ComponentFixture<ClientReviewFormComponent>;

  const mockInvitation: ReviewInvitationDetail = {
    booking_code: 'BK-TEST-123',
    worker_name: 'Budi Santoso',
    worker_slug: 'budi-santoso',
    worker_avatar: 'https://example.com/avatar.jpg',
    worker_zone: 'Jakarta Barat',
    service_name: 'Servis AC Rutin',
    booking_date: '2026-11-10T10:00:00Z',
    client_name: 'Ahmad Fauzi',
    is_reviewed: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientReviewFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientReviewFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('invitation', mockInvitation);
    fixture.detectChanges();
  });

  it('harus membuat instance ClientReviewFormComponent', () => {
    expect(component).toBeTruthy();
    expect(component.anonymizedPreview()).toBe('Ahmad F.');
  });

  it('harus menolak submit jika rating belum dipilih', () => {
    let emitted = false;
    component.submitReview.subscribe(() => {
      emitted = true;
    });

    component.commentText.set('Pekerjaan sangat rapi dan bagus');
    component.handleFormSubmit();

    expect(emitted).toBe(false);
    expect(component.ratingError()).toContain('Silakan pilih bintang');
  });

  it('harus menolak submit jika komentar kurang dari 5 karakter', () => {
    let emitted = false;
    component.submitReview.subscribe(() => {
      emitted = true;
    });

    component.selectedRating.set(5);
    component.commentText.set('Ok');
    component.handleFormSubmit();

    expect(emitted).toBe(false);
    expect(component.commentError()).toContain('minimal harus 5 karakter');
  });

  it('harus memancarkan data ulasan valid saat form di-submit', () => {
    let emittedData: { rating: number; comment: string; isAnonymous: boolean } | null = null;
    component.submitReview.subscribe((data) => {
      emittedData = data;
    });

    component.selectedRating.set(5);
    component.commentText.set('Teknisi sangat profesional dan AC dingin seketika');
    component.isAnonymous.set(true);

    component.handleFormSubmit();

    expect(emittedData).not.toBeNull();
    expect(emittedData?.rating).toBe(5);
    expect(emittedData?.isAnonymous).toBe(true);
    expect(emittedData?.comment).toContain('Teknisi sangat profesional');
  });
});

