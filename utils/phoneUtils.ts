export const formatPhoneNumber = (input: string, selectedCountryCode: string = ''): string | null => {
  // 1. Remove all non-digit and non-plus characters
  let cleaned = input.replace(/[^\d+]/g, '');

  if (!cleaned) return null;

  // 2. Check for "05" Israeli Mobile heuristic (User specified rule)
  // If it starts with 05 (and doesn't have a +), it's Israeli.
  // Replace leading '0' with '972'
  if (cleaned.startsWith('05')) {
    return '972' + cleaned.substring(1);
  }

  // 3. Check for explicit international format (starts with +)
  if (cleaned.startsWith('+')) {
    // Remove + for WhatsApp API
    return cleaned.substring(1);
  }

  // 4. Check for International Double Zero (00) format (e.g. 0044...)
  if (cleaned.startsWith('00')) {
    return cleaned.substring(2);
  }

  // 5. Use selected country code if provided
  if (selectedCountryCode) {
    // Standard rule: When adding a country code, strip the leading zero from the local number
    // e.g. UK (+44) + 077... -> 4477...
    // e.g. Israel (+972) + 03... -> 9723...
    let localNumber = cleaned;
    if (localNumber.startsWith('0')) {
      localNumber = localNumber.substring(1);
    }
    return selectedCountryCode.replace('+', '') + localNumber;
  }

  // 6. Fallback: Return as is (assuming user typed full format without +)
  return cleaned;
};

export const isValidPhoneNumber = (number: string): boolean => {
  // Basic length check for international numbers (usually 7-15 digits)
  return number.length >= 7 && number.length <= 15;
};
