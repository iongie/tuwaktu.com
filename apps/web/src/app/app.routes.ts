import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import(
        './features/worker-booking/components/worker-booking-page/worker-booking-page.component'
      ).then((m) => m.WorkerBookingPageComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import(
        './features/worker-booking/components/worker-booking-page/worker-booking-page.component'
      ).then((m) => m.WorkerBookingPageComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
