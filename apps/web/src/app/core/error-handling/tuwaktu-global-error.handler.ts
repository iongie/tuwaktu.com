import { ErrorHandler, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TuwaktuGlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Kesalahan internal tidak terduga';

    // Log terstruktur untuk observability tanpa membocorkan stack trace sensitif ke pengguna
    if (typeof console !== 'undefined' && console.error) {
      console.error('[Tuwaktu UI Global Error]:', errorMessage);
    }
  }
}

