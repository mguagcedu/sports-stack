import { z } from 'zod';

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export const defaultPasswordRequirements: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

export function createPasswordSchema(requirements: PasswordRequirements = defaultPasswordRequirements) {
  return z.string()
    .min(requirements.minLength, `Password must be at least ${requirements.minLength} characters`)
    .refine(
      (password) => !requirements.requireUppercase || /[A-Z]/.test(password),
      'Password must contain at least one uppercase letter'
    )
    .refine(
      (password) => !requirements.requireLowercase || /[a-z]/.test(password),
      'Password must contain at least one lowercase letter'
    )
    .refine(
      (password) => !requirements.requireNumber || /[0-9]/.test(password),
      'Password must contain at least one number'
    )
    .refine(
      (password) => !requirements.requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(password),
      'Password must contain at least one special character'
    );
}

export function getPasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  // Common patterns (negative)
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 1;
    feedback.push('Mix in numbers or symbols');
  }
  
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }
  
  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score -= 2;
    feedback.push('Avoid common patterns');
  }
  
  // Normalize score
  const normalizedScore = Math.max(0, Math.min(score, 7));
  
  let label: 'weak' | 'fair' | 'good' | 'strong';
  if (normalizedScore <= 2) label = 'weak';
  else if (normalizedScore <= 4) label = 'fair';
  else if (normalizedScore <= 5) label = 'good';
  else label = 'strong';
  
  return { score: normalizedScore, label, feedback };
}

export function validatePasswordRequirements(
  password: string,
  requirements: PasswordRequirements = defaultPasswordRequirements
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < requirements.minLength) {
    errors.push(`Must be at least ${requirements.minLength} characters`);
  }
  
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Must contain an uppercase letter');
  }
  
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Must contain a lowercase letter');
  }
  
  if (requirements.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Must contain a number');
  }
  
  if (requirements.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain a special character');
  }
  
  return { valid: errors.length === 0, errors };
}
