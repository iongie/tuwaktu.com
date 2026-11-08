import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { API_BASE_URL } from '../../../environments/environment.model';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockHttpClient: { post: jest.Mock };

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn().mockReturnValue(of({ success: true })),
    };

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(AnalyticsService);
  });

  it('harus membuat instance service', () => {
    expect(service).toBeTruthy();
  });

  it('harus mengirim event whatsapp_click dengan payload yang tepat', () => {
    service.trackWhatsAppClick('budi-santoso');

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/public/telemetry/events',
      expect.objectContaining({
        event_name: 'whatsapp_click',
        entity_type: 'worker',
        entity_id: 'budi-santoso',
      })
    );
  });

  it('harus mengirim event page_view_worker saat profil dibuka', () => {
    service.trackProfileView('budi-santoso');

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/public/telemetry/events',
      expect.objectContaining({
        event_name: 'page_view_worker',
        entity_type: 'worker',
        entity_id: 'budi-santoso',
      })
    );
  });

  it('harus mengirim event search_performed saat pencarian dilakukan', () => {
    service.trackSearch('AC Inverter', 'Jakarta Selatan');

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/public/telemetry/events',
      expect.objectContaining({
        event_name: 'search_performed',
        entity_type: 'search',
        metadata: expect.objectContaining({
          query: 'AC Inverter',
          location: 'Jakarta Selatan',
        }),
      })
    );
  });

  it('tidak boleh mengirim event jika query dan location search kosong', () => {
    service.trackSearch('', '');
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it('harus mengirim event booking_created saat reservasi berhasil dibuat', () => {
    service.trackBookingCreated('TW-12345', 'budi-santoso');

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/public/telemetry/events',
      expect.objectContaining({
        event_name: 'booking_created',
        entity_type: 'booking',
        entity_id: 'TW-12345',
      })
    );
  });
});

