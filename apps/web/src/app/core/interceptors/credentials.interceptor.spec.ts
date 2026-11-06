import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { credentialsInterceptor } from './credentials.interceptor';

describe('credentialsInterceptor', () => {
  describe('di platform Browser', () => {
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          provideHttpClient(withInterceptors([credentialsInterceptor])),
          provideHttpClientTesting(),
        ],
      });

      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('harus menyertakan withCredentials: true pada request keluar', () => {
      httpClient.get('/api/v1/workers').subscribe();

      const req = httpTestingController.expectOne('/api/v1/workers');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true });
    });

    it('harus menyertakan header ng-skip-http-transfer-cache untuk URL autentikasi', () => {
      httpClient.get('/api/v1/auth/me').subscribe();

      const req = httpTestingController.expectOne('/api/v1/auth/me');
      expect(req.request.headers.get('ng-skip-http-transfer-cache')).toBe('true');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true });
    });
  });

  describe('di platform Server (SSR)', () => {
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    const mockServerRequest = {
      headers: {
        get(name: string): string | null {
          const lower = name.toLowerCase();
          if (lower === 'cookie') return 'tuwaktu_token=jwt_mock_token_123';
          if (lower === 'authorization') return 'Bearer jwt_mock_token_123';
          return null;
        },
      },
    } as unknown as Request;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockServerRequest },
          provideHttpClient(withInterceptors([credentialsInterceptor])),
          provideHttpClientTesting(),
        ],
      });

      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('harus meneruskan cookie dan authorization dari incoming server request ke outgoing backend request', () => {
      httpClient.get('http://localhost:3000/api/v1/auth/me').subscribe();

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/me');
      expect(req.request.headers.get('cookie')).toBe('tuwaktu_token=jwt_mock_token_123');
      expect(req.request.headers.get('authorization')).toBe('Bearer jwt_mock_token_123');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true });
    });
  });
});

