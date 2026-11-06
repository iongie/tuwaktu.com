import { inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP yang memastikan seluruh permintaan ke backend menyertakan credentials
 * (cookie HTTP-only seperti tuwaktu_token untuk otentikasi sesi berbasis server).
 * Pada mode SSR server, interceptor meneruskan (forward) cookie dan authorization header
 * dari permintaan klien agar server tidak menganggap pengguna belum login.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;
  if (req.url.includes('/auth/')) {
    headers = headers.set('ng-skip-http-transfer-cache', 'true');
  }

  const platformId = inject(PLATFORM_ID);
  if (isPlatformServer(platformId)) {
    try {
      const serverRequest = inject(REQUEST, { optional: true });
      if (serverRequest) {
        const cookie = serverRequest.headers.get('cookie');
        if (cookie && !headers.has('cookie')) {
          headers = headers.set('cookie', cookie);
        }
        const authorization = serverRequest.headers.get('authorization');
        if (authorization && !headers.has('authorization')) {
          headers = headers.set('authorization', authorization);
        }
      }
    } catch {
      // Abaikan jika token REQUEST tidak tersedia di lingkungan eksekusi
    }
  }

  const reqWithCredentials = req.clone({
    withCredentials: true,
    headers,
  });
  return next(reqWithCredentials);
};
