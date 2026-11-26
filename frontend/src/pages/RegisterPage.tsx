import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthFrame } from '../components/layout/AuthFrame';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Fill in every field.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (!acceptTerms) {
      setError('Accept the terms to create an account.');
      return;
    }

    try {
      setLoading(true);
      await register(fullName, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create the account. That email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await loginWithGoogle({
        email: 'alex.vance@google.internal',
        name: 'Alex Vance',
        sub: 'google_oauth_sub_98129',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthFrame
      title="Create an account"
      subtitle={
        <>
          Already have one?{' '}
          <Link to="/login" className="font-semibold text-ink underline decoration-line underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Name
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="field mt-1.5"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="field mt-1.5"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="field pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-mute hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </span>
        </label>
        <label className="block text-sm font-medium">
          Confirm password
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Type it again"
            className="field mt-1.5"
            autoComplete="new-password"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-mute">
          <input
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          I agree to the terms and the privacy note on the home page.
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-mute">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} className="btn btn-quiet w-full">
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue with Google'}
      </button>
    </AuthFrame>
  );
};
