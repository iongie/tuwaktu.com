import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  AdminB2BInquiryStatus,
  AdminB2BPaymentStatus,
  B2B_PAYMENT_STATUS_LABELS,
  B2B_STATUS_LABELS,
} from '../../../models/admin-b2b-inquiry.model';

@Component({
  selector: 'app-admin-b2b-status-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded font-mono-rate text-[11px] font-bold tracking-wide border"
      [class]="badgeClasses()"
    >
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminB2BStatusBadgeComponent {
  readonly kind = input.required<'inquiry' | 'payment'>();
  readonly value = input.required<string>();

  readonly label = computed<string>(() => {
    const val = this.value();
    if (this.kind() === 'payment') {
      return B2B_PAYMENT_STATUS_LABELS[val as AdminB2BPaymentStatus] || val;
    }
    return B2B_STATUS_LABELS[val as AdminB2BInquiryStatus] || val;
  });

  readonly badgeClasses = computed<string>(() => {
    const val = this.value();
    if (this.kind() === 'payment') {
      switch (val) {
        case 'PAID':
          return 'bg-success-surface text-whatsapp-ink border-whatsapp-green/30';
        case 'WAITING_CONFIRMATION':
          return 'bg-warning-surface text-ink-on-light border-warning/40';
        case 'OVERDUE':
          return 'bg-error-surface text-error-dark border-error/30';
        default:
          return 'bg-surface-highlight text-ink-secondary border-hairline-light';
      }
    }

    switch (val) {
      case 'ACTIVE':
        return 'bg-success-surface text-whatsapp-ink border-whatsapp-green/30';
      case 'NEW':
        return 'bg-surface-warm-promo text-promo-ink border-voltage-orange/30';
      case 'CONTACTED':
      case 'PROPOSAL_SENT':
        return 'bg-warning-surface text-ink-on-light border-warning/40';
      case 'REJECTED':
        return 'bg-error-surface text-error-dark border-error/30';
      default:
        return 'bg-surface-highlight text-ink-secondary border-hairline-light';
    }
  });
}

