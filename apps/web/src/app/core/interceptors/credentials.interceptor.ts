import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP yang memastikan seluruh permintaan ke backend menyertakan credentials
 * (cookie HTTP-only seperti tuwaktu_token untuk otentikasi sesi berbasis server).
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;
  if (req.url.includes('/auth/')) {
    headers = headers.set('ng-skip-http-transfer-cache', 'true');
  }

  const reqWithCredentials = req.clone({
    withCredentials: true,
    headers,
  });
  return next(reqWithCredentials);
};
