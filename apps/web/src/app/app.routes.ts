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
    path: 'dashboard',
    redirectTo: 'dashboard/profile',
    pathMatch: 'full',
  },
  {
    path: 'dashboard/profile',
    loadComponent: () =>
      import(
        './features/worker-dashboard/components/worker-dashboard-profile/worker-dashboard-profile.component'
      ).then((m) => m.WorkerDashboardProfileComponent),
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
