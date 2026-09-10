/**
 * Color and Contrast Utility with WCAG 2.1 Contrast Ratio Calculation
 * Prevents illegible text contrast (such as white text on yellow buttons)
 * and validates hex code inputs.
 */

// Regex validating standard 3 or 6 digit hex colors
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Validates whether a given string is a strictly valid 3 or 6 digit hex color code.
 */
export function isValidHexColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return HEX_COLOR_REGEX.test(hex.trim());
}

/**
 * Normalizes a 3-character hex (#abc) into a 6-character hex (#aabbcc).
 * Returns null if the input is not a valid hex color.
 */
export function normalizeHex(hex: string): string | null {
  if (!isValidHexColor(hex)) return null;
  const clean = hex.trim();
  if (clean.length === 4) {
    const r = clean[1];
    const g = clean[2];
    const b = clean[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return clean.toUpperCase();
}

/**
 * Calculates WCAG 2.1 relative luminance for a given hex color.
 * Normalized channel values c in [0, 1] are converted to linear values,
 * then weighted: L = 0.2126*R + 0.7152*G + 0.0722*B
 */
export function getRelativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0;

  const rInt = parseInt(normalized.substring(1, 3), 16);
  const gInt = parseInt(normalized.substring(3, 5), 16);
  const bInt = parseInt(normalized.substring(5, 7), 16);

  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(rInt);
  const gLinear = toLinear(gInt);
  const bLinear = toLinear(bInt);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two hex colors:
 * (Lighter + 0.05) / (Darker + 0.05)
 * Returns a number rounded to 2 decimal places, e.g. 4.5 for 4.5:1.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  if (!isValidHexColor(hex1) || !isValidHexColor(hex2)) return 1.0;

  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Computes contrast ratio against pure white (#FFFFFF).
 */
export function getContrastWithWhite(hex: string): number {
  return getContrastRatio(hex, '#FFFFFF');
}

/**
 * Computes contrast ratio against pure black (#000000).
 */
export function getContrastWithBlack(hex: string): number {
  return getContrastRatio(hex, '#000000');
}

export interface ContrastAssessment {
  ratioWithWhite: number;
  ratioWithBlack: number;
  whitePassesAA: boolean; // >= 4.5:1
  whitePassesAALarge: boolean; // >= 3.0:1
  whitePassesAAA: boolean; // >= 7.0:1
  recommendedTextColor: '#ffffff' | '#09090b';
  status: 'safe' | 'warning' | 'critical';
  ratingLabel: string;
  message: string;
}

/**
 * Evaluates contrast compliance and provides guardrails to prevent illegible text
 * (such as white text on yellow buttons).
 */
export function evaluateColorContrast(hex: string): ContrastAssessment {
  if (!isValidHexColor(hex)) {
    return {
      ratioWithWhite: 1.0,
      ratioWithBlack: 1.0,
      whitePassesAA: false,
      whitePassesAALarge: false,
      whitePassesAAA: false,
      recommendedTextColor: '#ffffff',
      status: 'critical',
      ratingLabel: 'Invalid Hex',
      message: 'Enter a valid hex color (e.g., #4F46E5 or #FACC15).',
    };
  }

  const ratioWithWhite = getContrastWithWhite(hex);
  const ratioWithBlack = getContrastWithBlack(hex);

  const whitePassesAAA = ratioWithWhite >= 7.0;
  const whitePassesAA = ratioWithWhite >= 4.5;
  const whitePassesAALarge = ratioWithWhite >= 3.0;

  // If contrast with white is below 4.5:1, dark text (#09090b) is required for legibility
  const recommendedTextColor = ratioWithWhite >= 4.5 ? '#ffffff' : '#09090b';

  let status: 'safe' | 'warning' | 'critical';
  let ratingLabel: string;
  let message: string;

  if (ratioWithWhite >= 7.0) {
    status = 'safe';
    ratingLabel = 'AAA (High Contrast)';
    message = `Excellent contrast on white text (${ratioWithWhite}:1). Meets WCAG AAA standards.`;
  } else if (ratioWithWhite >= 4.5) {
    status = 'safe';
    ratingLabel = 'AA (Pass)';
    message = `Good contrast on white text (${ratioWithWhite}:1). Meets WCAG AA requirements.`;
  } else if (ratioWithWhite >= 3.0) {
    status = 'warning';
    ratingLabel = 'AA Large Only';
    message = `Marginal contrast with white text (${ratioWithWhite}:1). Only suitable for large bold text or icons.`;
  } else {
    status = 'critical';
    ratingLabel = 'Fail (< 3:1)';
    message = `Illegible contrast with white text (${ratioWithWhite}:1). White text on light/yellow colors cannot be read. Dark text (#09090b) will be automatically enforced for legibility.`;
  }

  return {
    ratioWithWhite,
    ratioWithBlack,
    whitePassesAA,
    whitePassesAALarge,
    whitePassesAAA,
    recommendedTextColor,
    status,
    ratingLabel,
    message,
  };
}

export interface PairContrastAssessment {
  ratio: number;
  passesAA: boolean; // >= 4.5:1
  passesAAA: boolean; // >= 7.0:1
  passesAALarge: boolean; // >= 3.0:1
  status: 'pass' | 'fail';
  recommendedTextColor: string;
  recommendedPrimaryColor?: string;
  message: string;
}

/**
 * Calculates the exact contrast ratio between primaryColor and textColor in real time.
 */
export function evaluatePairContrast(primaryHex: string, textHex: string): PairContrastAssessment {
  const pNorm = normalizeHex(primaryHex) || '#000000';
  const tNorm = normalizeHex(textHex) || '#FFFFFF';

  const ratio = getContrastRatio(pNorm, tNorm);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;
  const passesAALarge = ratio >= 3.0;

  // Find optimal accessible text color
  const whiteRatio = getContrastRatio(pNorm, '#FFFFFF');
  const blackRatio = getContrastRatio(pNorm, '#09090B');
  const recommendedTextColor = whiteRatio >= blackRatio ? '#FFFFFF' : '#09090B';

  let message = '';
  if (passesAAA) {
    message = `WCAG AAA Compliant (${ratio}:1). Pristine contrast readability.`;
  } else if (passesAA) {
    message = `WCAG AA Compliant (${ratio}:1). High legibility standard met.`;
  } else {
    message = `Low contrast (${ratio}:1): May be hard for visitors to read.`;
  }

  return {
    ratio,
    passesAA,
    passesAAA,
    passesAALarge,
    status: passesAA ? 'pass' : 'fail',
    recommendedTextColor,
    message,
  };
}

/**
 * Returns the mathematically accessible text color ('#ffffff' or '#09090b')
 * to guarantee readable contrast against any background color.
 */
export function getAccessibleTextColor(bgHex: string): '#ffffff' | '#09090b' {
  if (!isValidHexColor(bgHex)) return '#ffffff';
  return getContrastWithWhite(bgHex) >= 4.5 ? '#ffffff' : '#09090b';
}

/**
 * 8 Modern Curated Brand Palette Presets
 * (Indigo, Emerald, Violet, Rose, Slate, Amber, Ocean, Carbon)
 */
export interface BrandPalettePreset {
  id: string;
  name: string;
  primaryColor: string;
  textColor: string;
  description: string;
}

export const BRAND_PALETTE_PRESETS: BrandPalettePreset[] = [
  { id: 'indigo', name: 'Indigo', primaryColor: '#4F46E5', textColor: '#FFFFFF', description: 'Tech & Modern SaaS' },
  { id: 'emerald', name: 'Emerald', primaryColor: '#059669', textColor: '#FFFFFF', description: 'Growth & Finance' },
  { id: 'violet', name: 'Violet', primaryColor: '#7C3AED', textColor: '#FFFFFF', description: 'Creative & AI' },
  { id: 'rose', name: 'Rose', primaryColor: '#E11D48', textColor: '#FFFFFF', description: 'Retail & Hospitality' },
  { id: 'slate', name: 'Slate', primaryColor: '#475569', textColor: '#FFFFFF', description: 'Minimal & Neutral' },
  { id: 'amber', name: 'Amber', primaryColor: '#D97706', textColor: '#09090B', description: 'Support & Alerts' },
  { id: 'ocean', name: 'Ocean', primaryColor: '#0284C7', textColor: '#FFFFFF', description: 'Healthcare & Travel' },
  { id: 'carbon', name: 'Carbon', primaryColor: '#18181B', textColor: '#FFFFFF', description: 'Dark Luxury & Dev' },
];
