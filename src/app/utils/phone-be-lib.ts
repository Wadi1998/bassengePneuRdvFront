import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export type BeParse = {
  isValid: boolean;
  e164: string;
  national: string;
  error?: string;
};

/**
 * Valide/normalise un numéro belge.
 * Accepte : 0470 12 34 56, 02 123 45 67, +32 470..., 0032 2..., etc.
 * Retourne e164 (+32XXXXXXXXX) et national (0XXXXXXXX).
 */
export function parsePhoneBE(raw: string): BeParse {
  const input = (raw || '').trim();
  if (!input) return { isValid: false, e164: '', national: '', error: 'empty' };

  try {
    const num = phoneUtil.parseAndKeepRawInput(input, 'BE');

    // Valide pour la Belgique (format et longueur)
    if (!phoneUtil.isValidNumberForRegion(num, 'BE')) {
      return { isValid: false, e164: '', national: '', error: 'invalid_for_BE' };
    }

    const e164 = phoneUtil.format(num, PhoneNumberFormat.E164);             // +32...
    const national = phoneUtil.format(num, PhoneNumberFormat.NATIONAL);     // 0xx xx xx xx
    return { isValid: true, e164, national };
  } catch {
    return { isValid: false, e164: '', national: '', error: 'parse_error' };
  }
}

/** Validator Angular (Reactive Forms) pour un téléphone BE */
export function bePhoneLibValidator() {
  return (control: any) => {
    const v = String(control?.value ?? '');
    const res = parsePhoneBE(v);
    return res.isValid ? null : { bePhone: true };
  };
}
