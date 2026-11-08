export interface ReviewInvitationDetail {
  readonly booking_code: string;
  readonly worker_name: string;
  readonly worker_slug: string;
  readonly worker_avatar?: string;
  readonly worker_zone: string;
  readonly service_name: string;
  readonly booking_date: string;
  readonly client_name: string;
  readonly is_reviewed: boolean;
}

export interface SubmitReviewPayload {
  readonly booking_code: string;
  readonly token: string;
  readonly rating: number;
  readonly comment: string;
  readonly is_anonymous: boolean;
}

export interface ReviewRecord {
  readonly id: string;
  readonly booking_id: string;
  readonly worker_id: string;
  readonly client_name: string;
  readonly is_anonymous: boolean;
  readonly rating: number;
  readonly comment: string;
  readonly created_at: string;
}

