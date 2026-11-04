export interface SpecialtyOption {
  readonly id: string;
  readonly label: string;
  readonly colSpan?: boolean;
}

export type AuthMethod = 'wa' | 'id';

export type OtpDispatchStatus = 'idle' | 'sending' | 'sent' | 'error';

export type MagicLinkStatus = 'idle' | 'sending' | 'sent' | 'error';

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
}

export interface LoginFormData {
  method: AuthMethod;
  waNumber: string;
  workerId: string;
  pin: string;
  rememberDevice: boolean;
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

export const INITIAL_SPECIALTY_OPTIONS: readonly SpecialtyOption[] = [
  { id: 'cleaning', label: 'Spesialis Kebersihan Hunian' },
  { id: 'ac-electric', label: 'Teknisi AC & Kelistrikan' },
  { id: 'audio-acoustic', label: 'Servis Audio Akustik' },
  { id: 'electronics', label: 'Servis Elektronik Presisi' },
  { id: 'landscape', label: 'Perawatan Taman & Landscape Urban', colSpan: true },
];
