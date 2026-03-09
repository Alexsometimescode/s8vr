import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

import { supabase } from './supabase';
import { signUp, signIn, signOut, getSession, onAuthStateChange } from './auth';

describe('Auth Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create new user with Supabase Auth', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await signUp({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        options: {
          data: { name: 'Test User' },
          emailRedirectTo: expect.any(String),
        },
      });

      expect(result.user).toEqual(mockUser);
    });

    it('should throw error when auth fails', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email already registered' },
      } as any);

      await expect(
        signUp({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should throw error when user creation fails', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      } as any);

      await expect(
        signUp({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
      ).rejects.toThrow('User creation failed');
    });

    it('should create user profile in database', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      } as any);

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      await signUp({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'free',
          role: 'user',
        }),
        { onConflict: 'id' }
      );
    });
  });

  describe('signIn', () => {
    it('should authenticate user with email and password', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'jwt-token' },
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: mockSession,
        error: null,
      } as any);

      const result = await signIn({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.session.access_token).toBe('jwt-token');
    });

    it('should throw error on invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as any);

      await expect(
        signIn({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out current user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      } as any);

      await expect(signOut()).resolves.not.toThrow();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error on sign out failure', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: { message: 'Sign out failed' },
      } as any);

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'jwt-token',
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      } as any);

      const session = await getSession();

      expect(session).toEqual(mockSession);
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any);

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const mockCallback = vi.fn();

      onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should return subscription with unsubscribe method', () => {
      const mockCallback = vi.fn();

      const subscription = onAuthStateChange(mockCallback);

      expect(subscription.data.subscription.unsubscribe).toBeDefined();
    });
  });
});

describe('Auth Validation', () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  it('validates email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('no@')).toBe(false);
  });

  it('validates password strength', () => {
    expect(isStrongPassword('Password1')).toBe(true);
    expect(isStrongPassword('SecurePass123')).toBe(true);
    expect(isStrongPassword('password')).toBe(false); // no uppercase, no number
    expect(isStrongPassword('PASSWORD')).toBe(false); // no lowercase, no number
    expect(isStrongPassword('Pass1')).toBe(false); // too short
    expect(isStrongPassword('12345678')).toBe(false); // no letters
  });
});

describe('Session Management', () => {
  it('extracts user ID from JWT token', () => {
    // Simplified JWT structure for testing
    const decodeJWT = (token: string) => {
      try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
      } catch {
        return null;
      }
    };

    // Test with a mock JWT
    const mockPayload = { sub: 'user-123', email: 'test@example.com', exp: 9999999999 };
    const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

    const decoded = decodeJWT(mockToken);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('checks if session is expired', () => {
    const isExpired = (exp: number) => Date.now() / 1000 > exp;

    expect(isExpired(Date.now() / 1000 - 3600)).toBe(true); // 1 hour ago
    expect(isExpired(Date.now() / 1000 + 3600)).toBe(false); // 1 hour from now
  });
});
