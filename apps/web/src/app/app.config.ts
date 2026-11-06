import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import {
  API_BASE_URL,
  APP_ENVIRONMENT,
} from '../environments/environment.model';
import { TuwaktuGlobalErrorHandler } from './core/error-handling/tuwaktu-global-error.handler';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './features/auth/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includePostRequests: false,
      })
    ),
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useClass: TuwaktuGlobalErrorHandler,
    },
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(
        authService.checkAuthStatus().pipe(catchError(() => of(null)))
      );
    }),
    {
      provide: API_BASE_URL,
      useValue: environment.apiBaseUrl,
    },
    {
      provide: APP_ENVIRONMENT,
      useValue: environment,
    },
  ],
};
