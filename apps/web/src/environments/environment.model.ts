import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  production: boolean;
  environmentName: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  appTitle: string;
  enableDebugTools: boolean;
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000',
});

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
