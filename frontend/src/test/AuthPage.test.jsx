import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from '../pages/AuthPage';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth from AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockRegisterWithFirebaseEmail = vi.fn();
const mockLoginWithFirebaseEmail = vi.fn();
const mockSendFirebaseEmailLink = vi.fn();
const mockSetError = vi.fn();
let mockAuthError = null;

vi.mock('../context/AuthContext', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useAuth: () => ({
      login: mockLogin,
      register: mockRegister,
      loginWithGoogle: mockLoginWithGoogle,
      registerWithFirebaseEmail: mockRegisterWithFirebaseEmail,
      loginWithFirebaseEmail: mockLoginWithFirebaseEmail,
      sendFirebaseEmailLink: mockSendFirebaseEmailLink,
      error: mockAuthError,
      setError: mockSetError,
    }),
  };
});

describe('AuthPage Component Unit & Interactive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthError = null;
  });

  it('should render the Log In form by default', () => {
    render(<AuthPage />);

    expect(screen.getByText('connection')).toBeInTheDocument();
    expect(screen.getByText('Find your match in real-time')).toBeInTheDocument();
    
    // Login form should have email and password but NOT register fields
    expect(screen.getByPlaceholderText('e.g. john@gmail.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 6 chars')).toBeInTheDocument();
    
    expect(screen.queryByPlaceholderText('e.g. John Doe')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Min 18')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. London')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Enter Connection' })).toBeInTheDocument();
  });

  it('should toggle to Register form when clicking the Register tab', () => {
    render(<AuthPage />);

    // Click on Register Tab
    const registerTab = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerTab);

    // Form should now render registration inputs
    expect(screen.getByPlaceholderText('e.g. John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min 18')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. London')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. john@gmail.com')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: 'Create Match Profile' })).toBeInTheDocument();
  });

  it('should invoke login handler with input values on login submit', async () => {
    mockLoginWithFirebaseEmail.mockResolvedValue({ success: true });
    render(<AuthPage />);

    const emailInput = screen.getByPlaceholderText('e.g. john@gmail.com');
    const passwordInput = screen.getByPlaceholderText('At least 6 chars');
    const submitButton = screen.getByRole('button', { name: 'Enter Connection' });

    // Simulate typing
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secretpassword123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLoginWithFirebaseEmail).toHaveBeenCalledWith('john@example.com', 'secretpassword123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error alerts if error is set in auth context', () => {
    mockAuthError = 'Incorrect username or password.';
    render(<AuthPage />);

    expect(screen.getByText('Incorrect username or password.')).toBeInTheDocument();
  });

  it('should invoke register handler with full form payload on registration submit', async () => {
    mockRegisterWithFirebaseEmail.mockResolvedValue({ success: true });
    render(<AuthPage />);

    // Switch to Register Form
    const registerTab = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerTab);

    const nameInput = screen.getByPlaceholderText('e.g. John Doe');
    const ageInput = screen.getByPlaceholderText('Min 18');
    const locationInput = screen.getByPlaceholderText('e.g. London');
    const emailInput = screen.getByPlaceholderText('e.g. john@gmail.com');
    const passwordInput = screen.getByPlaceholderText('At least 6 chars');
    const submitButton = screen.getByRole('button', { name: 'Create Match Profile' });

    // Fill registration form inputs
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(ageInput, { target: { value: '24' } });
    fireEvent.change(locationInput, { target: { value: 'Paris' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepassword123' } });

    // Submit registration
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegisterWithFirebaseEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'securepassword123',
        {
          name: 'Jane Doe',
          age: 24,
          location: 'Paris',
          gender: 'male', // default value
          preference: 'female', // default value
          bio: ''
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should invoke Google sign-in handler on button click', async () => {
    mockLoginWithGoogle.mockResolvedValue({ success: true });
    render(<AuthPage />);

    const googleButton = screen.getByRole('button', { name: 'Continue with Google' });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should invoke sendFirebaseEmailLink handler on magic-link mode submit', async () => {
    mockSendFirebaseEmailLink.mockResolvedValue({ success: true });
    render(<AuthPage />);

    // Switch to Magic Link Mode
    const magicLinkTab = screen.getByRole('button', { name: 'Magic Link' });
    fireEvent.click(magicLinkTab);

    // Confirm only Email field and info description is shown
    expect(screen.queryByPlaceholderText('At least 6 chars')).not.toBeInTheDocument();
    expect(screen.getByText(/We'll send a secure, passwordless magic link/)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('e.g. john@gmail.com');
    const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });

    // Type email
    fireEvent.change(emailInput, { target: { value: 'magic@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendFirebaseEmailLink).toHaveBeenCalledWith('magic@example.com');
      expect(screen.getByText(/Magic link sent to/)).toBeInTheDocument();
    });
  });
});
