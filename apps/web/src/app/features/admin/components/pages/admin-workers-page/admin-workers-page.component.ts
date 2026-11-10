import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminWorkerStore } from '../../../services/admin-worker.store';
import { AdminWorkerFilterBarComponent } from '../../molecules/admin-worker-filter-bar/admin-worker-filter-bar.component';
import { AdminWorkersTableComponent } from '../../organisms/admin-workers-table/admin-workers-table.component';

@Component({
  selector: 'app-admin-workers-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AdminWorkerFilterBarComponent,
    AdminWorkersTableComponent,
  ],
  templateUrl: './admin-workers-page.component.html',
})
export class AdminWorkersPageComponent implements OnInit {
  readonly store = inject(AdminWorkerStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadWorkers();
  }

  navigateToAddWorker(): void {
    this.router.navigate(['/admin/workers/new']);
  }

  exportWorkers(): void {
    const list = this.store.filteredWorkers();
    if (!list || list.length === 0) return;

    if (typeof document === 'undefined') return;

    const headers = ['Nama', 'Slug', 'WhatsApp', 'Email', 'Zona', 'Tarif Dasar', 'Tipe Tarif', 'Status'];
    const rows = list.map((w) => [
      `"${w.name.replace(/"/g, '""')}"`,
      `"${w.slug}"`,
      `"${w.whatsapp_number || w.phone_number || ''}"`,
      `"${w.email}"`,
      `"${(w.zone || '').replace(/"/g, '""')}"`,
      w.base_price,
      `"${w.rate_type}"`,
      `"${w.account_status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `direktori-mitra-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
