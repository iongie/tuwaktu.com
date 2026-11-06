import { Route } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import(
        './features/home/components/pages/home-page/home-page.component'
      ).then((m) => m.HomePageComponent),
  },
  {
    path: 'dashboard/profile',
    redirectTo: 'dashboard/integrasi-whatsapp',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import(
        './features/worker-dashboard/components/pages/worker-dashboard-layout/worker-dashboard-layout.component'
      ).then((m) => m.WorkerDashboardLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'ringkasan',
      },
      {
        path: 'ringkasan',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-summary/worker-dashboard-summary.component'
          ).then((m) => m.WorkerDashboardSummaryComponent),
      },
      {
        path: 'tarif-layanan',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-rates/worker-dashboard-rates.component'
          ).then((m) => m.WorkerDashboardRatesComponent),
      },
      {
        path: 'tarif',
        redirectTo: 'tarif-layanan',
      },
      {
        path: 'logistik-radius',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-logistics/worker-dashboard-logistics.component'
          ).then((m) => m.WorkerDashboardLogisticsComponent),
      },
      {
        path: 'logistik',
        redirectTo: 'logistik-radius',
      },
      {
        path: 'kalender-slot',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-schedule/worker-dashboard-schedule.component'
          ).then((m) => m.WorkerDashboardScheduleComponent),
      },
      {
        path: 'jadwal',
        redirectTo: 'kalender-slot',
      },
      {
        path: 'integrasi-whatsapp',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-whatsapp/worker-dashboard-whatsapp.component'
          ).then((m) => m.WorkerDashboardWhatsAppProfileComponent),
      },
      {
        path: 'whatsapp',
        redirectTo: 'integrasi-whatsapp',
      },
      {
        path: 'profile',
        redirectTo: 'integrasi-whatsapp',
      },
      {
        path: 'plan',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-plan/worker-dashboard-plan.component'
          ).then((m) => m.WorkerDashboardPlanComponent),
      },
      {
        path: 'boost',
        loadComponent: () =>
          import(
            './features/worker-dashboard/components/pages/worker-dashboard-boost/worker-dashboard-boost.component'
          ).then((m) => m.WorkerDashboardBoostComponent),
      },
    ],
  },
  {
    path: 'plan',
    redirectTo: 'dashboard/plan',
  },
  {
    path: 'boost',
    redirectTo: 'dashboard/boost',
  },
  {
    path: 'register',
    loadComponent: () =>
      import(
        './features/auth/components/pages/worker-register-page/worker-register-page.component'
      ).then((m) => m.WorkerRegisterPageComponent),
  },
  {
    path: 'daftar',
    redirectTo: 'register',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './features/auth/components/pages/worker-login-page/worker-login-page.component'
      ).then((m) => m.WorkerLoginPageComponent),
  },
  {
    path: 'masuk',
    redirectTo: 'login',
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'workers',
      },
      {
        path: 'workers',
        loadComponent: () =>
          import(
            './features/admin/components/pages/admin-workers-page/admin-workers-page.component'
          ).then((m) => m.AdminWorkersPageComponent),
      },
    ],
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
