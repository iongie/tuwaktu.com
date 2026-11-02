import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/worker-demo/worker-demo.component').then(
        (m) => m.WorkerDemoComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
