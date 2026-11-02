import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
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
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
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
