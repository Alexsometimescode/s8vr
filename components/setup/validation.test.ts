import { describe, it, expect } from 'vitest';

// Re-implement validation functions for testing
// (In production, these should be extracted to a shared module)

const validateSupabaseUrl = (url: string): string | null => {
  if (!url) return null;
  if (!url.startsWith('https://')) return 'URL must start with https://';
  if (!url.includes('.supabase.co')) return 'URL should be a Supabase project URL';
  return null;
};

const validateSupabaseKey = (key: string, type: 'anon' | 'service'): string | null => {
  if (!key) return null;
  if (!key.startsWith('eyJ')) return 'Key should start with "eyJ"';
  if (key.length < 100) return 'Key appears to be incomplete';
  return null;
};

const validateStripeKey = (key: string): string | null => {
  if (!key) return null;
  if (!key.startsWith('sk_')) return 'Secret key should start with "sk_"';
  if (key.startsWith('sk_test_')) return null;
  if (key.startsWith('sk_live_')) return null;
  return 'Key should be sk_test_... or sk_live_...';
};

const validateResendKey = (key: string): string | null => {
  if (!key) return null;
  if (!key.startsWith('re_')) return 'API key should start with "re_"';
  return null;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

describe('Validation Helpers', () => {
  describe('validateSupabaseUrl', () => {
    it('should return null for empty string', () => {
      expect(validateSupabaseUrl('')).toBeNull();
    });

    it('should accept valid Supabase URL', () => {
      expect(validateSupabaseUrl('https://myproject.supabase.co')).toBeNull();
    });

    it('should reject HTTP URLs', () => {
      expect(validateSupabaseUrl('http://myproject.supabase.co')).toBe('URL must start with https://');
    });

    it('should reject non-Supabase URLs', () => {
      expect(validateSupabaseUrl('https://example.com')).toBe('URL should be a Supabase project URL');
    });

    it('should accept URLs with paths', () => {
      expect(validateSupabaseUrl('https://myproject.supabase.co/rest/v1')).toBeNull();
    });
  });

  describe('validateSupabaseKey', () => {
    const validKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.test';

    it('should return null for empty string', () => {
      expect(validateSupabaseKey('', 'anon')).toBeNull();
    });

    it('should accept valid JWT key', () => {
      expect(validateSupabaseKey(validKey, 'anon')).toBeNull();
    });

    it('should reject keys not starting with eyJ', () => {
      expect(validateSupabaseKey('invalid-key', 'anon')).toBe('Key should start with "eyJ"');
    });

    it('should reject short keys', () => {
      expect(validateSupabaseKey('eyJshort', 'anon')).toBe('Key appears to be incomplete');
    });
  });

  describe('validateStripeKey', () => {
    it('should return null for empty string', () => {
      expect(validateStripeKey('')).toBeNull();
    });

    it('should accept test key', () => {
      expect(validateStripeKey('sk_test_1234567890abcdef')).toBeNull();
    });

    it('should accept live key', () => {
      expect(validateStripeKey('sk_live_1234567890abcdef')).toBeNull();
    });

    it('should reject keys not starting with sk_', () => {
      expect(validateStripeKey('pk_test_123')).toBe('Secret key should start with "sk_"');
    });

    it('should reject invalid sk_ keys', () => {
      expect(validateStripeKey('sk_invalid_123')).toBe('Key should be sk_test_... or sk_live_...');
    });
  });

  describe('validateResendKey', () => {
    it('should return null for empty string', () => {
      expect(validateResendKey('')).toBeNull();
    });

    it('should accept valid Resend key', () => {
      expect(validateResendKey('re_1234567890')).toBeNull();
    });

    it('should reject keys not starting with re_', () => {
      expect(validateResendKey('invalid_key')).toBe('API key should start with "re_"');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.')).toBe(false);
      expect(isValidEmail('test example.com')).toBe(false);
    });
  });
});

describe('Account Validation', () => {
  describe('Name Validation', () => {
    const isNameValid = (name: string) => name.trim().length >= 2;

    it('should accept valid names', () => {
      expect(isNameValid('Jo')).toBe(true);
      expect(isNameValid('John Doe')).toBe(true);
      expect(isNameValid('A B')).toBe(true);
    });

    it('should reject too short names', () => {
      expect(isNameValid('')).toBe(false);
      expect(isNameValid('J')).toBe(false);
      expect(isNameValid(' ')).toBe(false);
      expect(isNameValid('  ')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    const isPasswordValid = (password: string) => password.length >= 8;

    it('should accept valid passwords', () => {
      expect(isPasswordValid('12345678')).toBe(true);
      expect(isPasswordValid('securepassword')).toBe(true);
      expect(isPasswordValid('P@ssw0rd!')).toBe(true);
    });

    it('should reject too short passwords', () => {
      expect(isPasswordValid('')).toBe(false);
      expect(isPasswordValid('1234567')).toBe(false);
      expect(isPasswordValid('short')).toBe(false);
    });
  });
});
