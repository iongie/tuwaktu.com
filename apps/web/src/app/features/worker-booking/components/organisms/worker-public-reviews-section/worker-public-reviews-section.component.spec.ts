import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerPublicReviewsSectionComponent } from './worker-public-reviews-section.component';
import { PublicReviewItem } from '../../../models/worker-catalog.model';

describe('WorkerPublicReviewsSectionComponent', () => {
  let component: WorkerPublicReviewsSectionComponent;
  let fixture: ComponentFixture<WorkerPublicReviewsSectionComponent>;

  const mockReviews: PublicReviewItem[] = [
    {
      id: 'rev-01',
      client_display_name: 'Budi S.',
      rating: 5,
      comment: 'Servis AC cepat dan dingin kembali!',
      service_name: 'Cuci AC Standar',
      created_at: '2026-11-05T12:00:00Z',
    },
    {
      id: 'rev-02',
      client_display_name: 'Siti Rahma',
      rating: 4,
      comment: 'Datang tepat waktu dan sopan.',
      service_name: 'Isi Freon',
      created_at: '2026-11-06T15:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerPublicReviewsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerPublicReviewsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance WorkerPublicReviewsSectionComponent', () => {
    expect(component).toBeTruthy();
    expect(component.formattedRating()).toBe('Baru');
  });

  it('harus memformat rating dan menampilkan ulasan saat data tersedia', () => {
    fixture.componentRef.setInput('reviews', mockReviews);
    fixture.componentRef.setInput('rating', 4.8);
    fixture.componentRef.setInput('reviewCount', 2);
    fixture.detectChanges();

    expect(component.formattedRating()).toBe('4.8');
    expect(component.reviews().length).toBe(2);
    expect(component.formatDate('2026-11-05T12:00:00Z')).toContain('2026');
  });
});

