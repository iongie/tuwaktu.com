import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE_URL, APP_ENVIRONMENT } from '../environments/environment.model';
import { environment } from '../environments/environment';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: API_BASE_URL,
      useFactory: () => {
        const runtimeEnv =
          typeof process !== 'undefined' && process.env
            ? process.env['API_BASE_URL']
            : undefined;
        return runtimeEnv || environment.apiBaseUrl;
      },
    },
    {
      provide: APP_ENVIRONMENT,
      useFactory: () => {
        const runtimeApiUrl =
          typeof process !== 'undefined' && process.env
            ? process.env['API_BASE_URL']
            : undefined;
        return runtimeApiUrl
          ? { ...environment, apiBaseUrl: runtimeApiUrl }
          : environment;
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
