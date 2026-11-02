/**
 * Email validation and typo detection utility for CampusSwap.
 * Prevents bounced transactional emails in Supabase by strictly validating email addresses
 * before any signup, login, or recovery requests are sent.
 */

// RFC 5322 compliant regex with strict domain and TLD requirements
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Common domain typos that lead to hard bounces
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'ms.pict': 'ms.pict.edu',
  'pict': 'pict.edu',
};

export interface EmailValidationResult {
  isValid: boolean;
  sanitizedEmail: string;
  error?: string;
  suggestion?: string;
}

/**
 * Validates, trims, and checks an email address for common syntax errors and typos.
 */
export function validateEmail(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      sanitizedEmail: '',
      error: 'Please enter your email address.',
    };
  }

  const sanitizedEmail = rawEmail.trim().toLowerCase();

  if (sanitizedEmail.length === 0) {
    return {
      isValid: false,
      sanitizedEmail: '',
      error: 'Email address cannot be empty.',
    };
  }

  if (sanitizedEmail.length > 254) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email address exceeds maximum allowed length (254 characters).',
    };
  }

  // Must contain an @ symbol
  if (!sanitizedEmail.includes('@')) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email address is missing the "@" symbol.',
    };
  }

  const parts = sanitizedEmail.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email address must contain exactly one "@" symbol.',
    };
  }

  const [localPart, domainPart] = parts;

  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Please enter the username portion before the "@" symbol.',
    };
  }

  if (!domainPart || domainPart.length === 0) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Please enter the domain portion after the "@" symbol (e.g., college.edu or gmail.com).',
    };
  }

  // Domain must contain at least one dot separating domain name and TLD
  if (!domainPart.includes('.')) {
    // Check if domain is a known college prefix like ms.pict or pict
    if (COMMON_DOMAIN_TYPOS[domainPart]) {
      return {
        isValid: false,
        sanitizedEmail,
        error: `Incomplete domain. Did you mean ${localPart}@${COMMON_DOMAIN_TYPOS[domainPart]}?`,
        suggestion: `${localPart}@${COMMON_DOMAIN_TYPOS[domainPart]}`,
      };
    }

    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email domain must have a valid extension (e.g., .edu, .ac.in, or .com).',
    };
  }

  // TLD check (must have at least 2 characters at the end, e.g. .in, .edu, .com)
  const domainSections = domainPart.split('.');
  const tld = domainSections[domainSections.length - 1];
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email domain extension must be at least 2 letters (e.g. .com, .edu, .in).',
    };
  }

  // Full RFC regex validation
  if (!EMAIL_REGEX.test(sanitizedEmail)) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Please enter a valid email format (e.g., student@college.edu or name@gmail.com).',
    };
  }

  // Check for common domain typos that cause instant hard bounces
  if (COMMON_DOMAIN_TYPOS[domainPart]) {
    const suggestedEmail = `${localPart}@${COMMON_DOMAIN_TYPOS[domainPart]}`;
    return {
      isValid: false,
      sanitizedEmail,
      error: `Possible domain typo. Did you mean ${suggestedEmail}?`,
      suggestion: suggestedEmail,
    };
  }

  return {
    isValid: true,
    sanitizedEmail,
  };
}
