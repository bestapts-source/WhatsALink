import {
  CountryCode,
  findPhoneNumbersInText,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/max';

export interface CountryOption {
  code: CountryCode;
  name: string;
  flag: string;
  dial: string;
}

const flagEmoji = (iso: string): string =>
  String.fromCodePoint(...[...iso.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));

const buildCountryOptions = (): CountryOption[] => {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' });
  } catch {
    names = null;
  }
  return getCountries()
    .map(code => ({
      code,
      name: names?.of(code) ?? code,
      flag: flagEmoji(code),
      dial: getCountryCallingCode(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const COUNTRY_OPTIONS: CountryOption[] = buildCountryOptions();

/** Best guess of the user's country from the device language/region, e.g. "he" -> IL. */
export const getDefaultRegion = (): CountryCode | undefined => {
  const supported = new Set<string>(getCountries());
  const langs = typeof navigator !== 'undefined' ? [...(navigator.languages ?? []), navigator.language] : [];
  for (const lang of langs) {
    if (!lang) continue;
    try {
      const region = new Intl.Locale(lang).maximize().region;
      if (region && supported.has(region)) return region as CountryCode;
    } catch {
      // ignore malformed locale
    }
  }
  return undefined;
};

// "0044 7911..." / "011 44 ..." style international prefixes -> "+"
const normalizeIntlPrefix = (input: string): string => input.trim().replace(/^00(?=\d)/, '+');

const toWaDigits = (e164: string): string => e164.replace(/^\+/, '');

/**
 * Turns user input into the digits-only international format wa.me expects.
 * `country` is an ISO code chosen by the user; empty means auto-detect
 * (explicit +/00 prefix first, then the device region, then a legacy Israeli 05 fallback).
 */
export const formatPhoneNumber = (input: string, country: string = ''): string | null => {
  const text = normalizeIntlPrefix(input);
  if (!/\d/.test(text)) return null;

  const hasPlus = text.startsWith('+');
  const candidates: (CountryCode | undefined)[] = hasPlus
    ? [undefined]
    : country
      ? [country as CountryCode]
      : [getDefaultRegion(), 'IL'];

  for (const region of candidates) {
    const parsed = parsePhoneNumberFromString(text, region);
    if (parsed?.isValid()) return toWaDigits(parsed.number);
  }

  // Not strictly valid (new ranges, odd formats): still hand over a plausible number.
  const digits = text.replace(/\D/g, '');
  if (hasPlus) return digits.length >= 7 && digits.length <= 15 ? digits : null;
  if (country) {
    const local = digits.replace(/^0+/, '');
    const full = getCountryCallingCode(country as CountryCode) + local;
    return full.length >= 7 && full.length <= 15 ? full : null;
  }
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
};

/** Country that the current input resolves to (for the "detected" badge), if any. */
export const detectCountry = (input: string): CountryCode | undefined => {
  const text = normalizeIntlPrefix(input);
  if (!/\d/.test(text)) return undefined;
  const regions: (CountryCode | undefined)[] = text.startsWith('+') ? [undefined] : [getDefaultRegion(), 'IL'];
  for (const region of regions) {
    const parsed = parsePhoneNumberFromString(text, region);
    if (parsed?.isValid() && parsed.country) return parsed.country;
  }
  return undefined;
};

export const isValidPhoneNumber = (number: string): boolean =>
  number.length >= 7 && number.length <= 15;

/**
 * Finds the most likely phone number inside messy text (signatures, chats, emails).
 * Works for any country: numbers with a +/00 prefix are parsed as-is, local ones use
 * `country` (or the device region). Mobile numbers are preferred over landlines.
 */
export const extractPhoneNumber = (text: string, country: string = ''): string | null => {
  const cleaned = text.replace(/(^|[^\d])00(?=\d{6,})/g, '$1+');
  const region = (country as CountryCode) || getDefaultRegion();

  const found = [...findPhoneNumbersInText(cleaned, region)];
  if (!found.length && !country) {
    found.push(...findPhoneNumbersInText(cleaned, 'IL'));
  }
  const valid = found.map(f => f.number).filter(n => n.isValid());
  const mobile = valid.find(n => {
    const type = n.getType();
    return type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
  });
  const best = mobile ?? valid[0];
  if (best) return toWaDigits(best.number);

  // Last resort: first run of 7-15 digits once separators are stripped.
  for (const run of cleaned.match(/\+?\d[\d\s().-]{5,}\d/g) ?? []) {
    const formatted = formatPhoneNumber(run, country);
    if (formatted) return formatted;
  }
  return null;
};
