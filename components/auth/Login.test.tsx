import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';

// Mock the auth module
vi.mock('../../src/lib/auth', () => ({
  signIn: vi.fn(),
}));

import { signIn } from '../../src/lib/auth';

describe('Login Component', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToSignUp = vi.fn();
  const mockOnBackToLanding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your s8vr account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows back button when onBackToLanding is provided', () => {
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
        onBackToLanding={mockOnBackToLanding}
      />
    );

    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });

  it('hides back button when onBackToLanding is not provided', () => {
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    expect(screen.queryByText('Back to home')).not.toBeInTheDocument();
  });

  it('calls onBackToLanding when back button clicked', async () => {
    const user = userEvent.setup();
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
        onBackToLanding={mockOnBackToLanding}
      />
    );

    await user.click(screen.getByText('Back to home'));
    expect(mockOnBackToLanding).toHaveBeenCalled();
  });

  it('calls onSwitchToSignUp when sign up link clicked', async () => {
    const user = userEvent.setup();
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    await user.click(screen.getByText(/Don't have an account/i));
    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token' },
    });

    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });

  it('displays error message on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('clears error when form is resubmitted', async () => {
    const user = userEvent.setup();
    vi.mocked(signIn)
      .mockRejectedValueOnce(new Error('Invalid credentials'))
      .mockResolvedValueOnce({
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token' },
      });

    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    // First attempt - fails
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Second attempt - succeeds
    await user.clear(screen.getByPlaceholderText('••••••••'));
    await user.type(screen.getByPlaceholderText('••••••••'), 'correctpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  it('validates email input is required', async () => {
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toHaveAttribute('required');
  });

  it('validates password input is required', async () => {
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('shows security footer', () => {
    render(
      <Login
        onSuccess={mockOnSuccess}
        onSwitchToSignUp={mockOnSwitchToSignUp}
      />
    );

    expect(screen.getByText('Secure login powered by Supabase')).toBeInTheDocument();
  });
});

describe('Login Validation', () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 8;

  it('validates email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
  });

  it('validates password length', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('securepassword')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});
