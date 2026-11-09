import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../organisms/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../../organisms/admin-header/admin-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebarComponent,
    AdminHeaderComponent,
  ],
  template: `
    <div class="min-h-screen bg-surface-container-lowest text-on-surface antialiased flex flex-col">
      <!-- Sidebar Kiri Admin Console -->
      <app-admin-sidebar
        [isMobileOpen]="isMobileSidebarOpen()"
        (closeMobile)="closeMobileSidebar()"
      />

      <!-- Workspace Area -->
      <div class="lg:pl-64 flex flex-col min-h-screen flex-1">
        <!-- Minimalist Header Top Bar -->
        <app-admin-header (toggleMobileSidebar)="toggleMobileSidebar()" />

        <!-- Router Outlet Konten Halaman Admin -->
        <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly isMobileSidebarOpen = signal<boolean>(false);

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update((isOpen) => !isOpen);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }
}

