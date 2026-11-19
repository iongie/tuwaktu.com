import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthHeaderNavComponent } from '../../../../auth/components/molecules/auth-header-nav/auth-header-nav.component';
import { HomeFooterSectionComponent } from '../../../../home/components/organisms/home-footer-section/home-footer-section.component';
import { BUSINESS_PLAN_OPTIONS } from '../../../models/business-inquiry.model';
import { BusinessInquiryStore } from '../../../services/business-inquiry.store';
import { BusinessPlanOptionCardComponent } from '../../molecules/business-plan-option-card/business-plan-option-card.component';
import { BusinessInquiryReceiptCardComponent } from '../../molecules/business-inquiry-receipt-card/business-inquiry-receipt-card.component';
import { BusinessInquiryFormComponent } from '../../organisms/business-inquiry-form/business-inquiry-form.component';

@Component({
  selector: 'app-business-client-page',
  standalone: true,
  imports: [
    CommonModule,
    AuthHeaderNavComponent,
    HomeFooterSectionComponent,
    BusinessPlanOptionCardComponent,
    BusinessInquiryReceiptCardComponent,
    BusinessInquiryFormComponent,
  ],
  templateUrl: './business-client-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessClientPageComponent {
  readonly store = inject(BusinessInquiryStore);
  readonly planOptions = BUSINESS_PLAN_OPTIONS;
}

