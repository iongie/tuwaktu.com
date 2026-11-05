import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { AuthHeaderNavComponent } from '../../../../auth/components/molecules/auth-header-nav/auth-header-nav.component';
import { HomeHeroSectionComponent } from '../../organisms/home-hero-section/home-hero-section.component';
import { HomeDisciplinesSectionComponent } from '../../organisms/home-disciplines-section/home-disciplines-section.component';
import { HomeFeaturedWorkersSectionComponent } from '../../organisms/home-featured-workers-section/home-featured-workers-section.component';
import { HomeComparisonSectionComponent } from '../../organisms/home-comparison-section/home-comparison-section.component';
import { HomeWorkflowSectionComponent } from '../../organisms/home-workflow-section/home-workflow-section.component';
import { HomeSimulatorSectionComponent } from '../../organisms/home-simulator-section/home-simulator-section.component';
import { HomeTestimonialsSectionComponent } from '../../organisms/home-testimonials-section/home-testimonials-section.component';
import { HomeFaqSectionComponent } from '../../organisms/home-faq-section/home-faq-section.component';
import { HomeFooterSectionComponent } from '../../organisms/home-footer-section/home-footer-section.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    AuthHeaderNavComponent,
    HomeHeroSectionComponent,
    HomeDisciplinesSectionComponent,
    HomeFeaturedWorkersSectionComponent,
    HomeComparisonSectionComponent,
    HomeWorkflowSectionComponent,
    HomeSimulatorSectionComponent,
    HomeTestimonialsSectionComponent,
    HomeFaqSectionComponent,
    HomeFooterSectionComponent,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly documentTitle = inject(Title);
  private readonly metaService = inject(Meta);

  ngOnInit(): void {
    this.configureSeoMeta();
  }

  onHeroSearch(): void {
    const featuredSection = document.getElementById('spesialis-unggulan');
    if (featuredSection && typeof featuredSection.scrollIntoView === 'function') {
      featuredSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private configureSeoMeta(): void {
    const title = 'Tuwaktu - Temukan Teknisi Terverifikasi Tanpa Komisi Perantara';
    const description =
      'Platform reservasi mandiri untuk teknisi AC, instalasi kelistrikan, sanitasi deep clean, dan servis elektronik di Indonesia. Hubungan langsung ke WhatsApp mitra tanpa potongan komisi.';

    this.documentTitle.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Tuwaktu' });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
  }
}
