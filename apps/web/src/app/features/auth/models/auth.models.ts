export interface SpecialtyOption {
  readonly id: string;
  readonly label: string;
  readonly colSpan?: boolean;
}

export type AuthMethod = 'wa' | 'id';

export type OtpDispatchStatus = 'idle' | 'sending' | 'sent' | 'error';

export type MagicLinkStatus = 'idle' | 'sending' | 'sent' | 'error';

export type AltchaStatus = 'idle' | 'verifying' | 'verified' | 'error';

export interface AltchaChallenge {
  readonly algorithm: string;
  readonly challenge: string;
  readonly maxnumber: number;
  readonly salt: string;
  readonly signature: string;
}

export interface RegisterFormData {
  fullName: string;
  specialtyId: string;
  specialtyLabel: string;
  waNumber: string;
  basecamp: string;
  customSlug: string;
  pin: string;
  pinConfirm: string;
  doctrineAccepted: boolean;
  altchaPayload?: string;
}

export interface LoginFormData {
  method: AuthMethod;
  waNumber: string;
  workerId: string;
  pin: string;
  rememberDevice: boolean;
  altchaPayload?: string;
}

export interface SlugValidationState {
  isValid: boolean;
  message: string;
}

export interface AuthUserSession {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly email?: string;
  readonly waNumber?: string;
  readonly avatarUrl?: string;
  readonly role?: 'worker' | 'client' | 'admin' | 'ADMIN' | 'WORKER';
  readonly token?: string;
  readonly accountStatus?: 'ACTIVE' | 'SUSPENDED' | string;
  readonly mustChangePassword?: boolean;
}

export interface AuthLoginResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
}

export interface AuthRegisterResponse {
  readonly worker_id: string;
  readonly name: string;
  readonly slug: string;
  readonly whatsapp_number: string;
  readonly admin_whatsapp_number: string;
  readonly activation_url: string;
  readonly whatsapp_share_url: string;
  readonly whatsapp_web_url: string;
  readonly whatsapp_message: string;
  readonly expires_in_minutes: number;
}

export interface AuthRegisterResult {
  readonly success: boolean;
  readonly message?: string;
  readonly data?: AuthRegisterResponse;
  readonly error?: string;
}

export interface BackendUserSession {
  readonly id: string;
  readonly worker_id?: string;
  readonly worker_slug?: string;
  readonly slug?: string;
  readonly name: string;
  readonly avatar_url?: string;
  readonly email: string;
  readonly phone_number: string;
  readonly role: string;
  readonly account_status: string;
  readonly must_change_password: boolean;
}

export interface BackendLoginData {
  readonly token: string;
  readonly session: BackendUserSession;
}

export const INITIAL_SPECIALTY_OPTIONS: readonly SpecialtyOption[] = [
  { id: 'cleaning', label: 'Spesialis Kebersihan Hunian' },
  { id: 'ac-electric', label: 'Teknisi AC & Kelistrikan' },
  { id: 'audio-acoustic', label: 'Servis Audio Akustik' },
  { id: 'electronics', label: 'Servis Elektronik Presisi' },
  { id: 'landscape', label: 'Perawatan Taman & Landscape Urban' },
  { id: 'general', label: 'Lainnya / Teknisi Multitalenta', colSpan: true },
];

export type CredentialResetType = 'RESET_PIN' | 'CHANGE_PHONE';

export interface CredentialResetRequestPayload {
  readonly phone_number: string;
  readonly request_type: CredentialResetType;
  readonly altcha_payload?: string;
}

export interface CredentialResetRequestResponse {
  readonly worker_name: string;
  readonly phone_number: string;
  readonly admin_whatsapp_number: string;
  readonly whatsapp_share_url: string;
  readonly whatsapp_web_url: string;
  readonly whatsapp_message: string;
  readonly expires_in_minutes: number;
}

export interface AdminResetApprovalView {
  readonly request_id: string;
  readonly worker_id: string;
  readonly worker_name: string;
  readonly worker_phone: string;
  readonly request_type: CredentialResetType;
  readonly created_at: string;
  readonly expires_at: string;
  readonly is_approved: boolean;
}

export interface AdminApproveResetResponse {
  readonly worker_name: string;
  readonly worker_whatsapp_number: string;
  readonly whatsapp_share_url: string;
  readonly whatsapp_web_url: string;
  readonly whatsapp_message: string;
  readonly execution_url: string;
  readonly expires_in_minutes: number;
}

export interface ExecuteCredentialResetPayload {
  readonly execution_token: string;
  readonly phone_number: string;
  readonly new_pin: string;
  readonly new_phone_number?: string;
  readonly altcha_payload?: string;
}
