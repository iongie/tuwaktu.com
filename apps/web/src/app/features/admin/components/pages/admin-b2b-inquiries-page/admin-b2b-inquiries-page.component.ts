import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminB2BInquiryStore } from '../../../services/admin-b2b-inquiry.store';
import { FeedbackAlertBannerComponent } from '../../../../worker-dashboard/components/molecules/feedback-alert-banner/feedback-alert-banner.component';
import { AdminB2BInquiryListComponent } from '../../organisms/admin-b2b-inquiry-list/admin-b2b-inquiry-list.component';
import { AdminB2BInquiryModalComponent } from '../../organisms/admin-b2b-inquiry-modal/admin-b2b-inquiry-modal.component';
import { formatRupiahIdr } from '../../../../business-client/models/business-inquiry.model';

@Component({
  selector: 'app-admin-b2b-inquiries-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FeedbackAlertBannerComponent,
    AdminB2BInquiryListComponent,
    AdminB2BInquiryModalComponent,
  ],
  templateUrl: './admin-b2b-inquiries-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminB2BInquiriesPageComponent implements OnInit {
  readonly store = inject(AdminB2BInquiryStore);

  ngOnInit(): void {
    this.store.loadInquiries();
  }

  formatRupiah(value: number): string {
    return formatRupiahIdr(value);
  }
}

