import { CheckCircle2, Clock, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { resendOtp, verifyOtp } from '../services/authService';

interface VerifyOtpLocationState {
  email?: string;
}

export function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VerifyOtpLocationState | null;

  const [form, setForm] = useState({ email: state?.email ?? '', otp: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // 30-second resend cooldown (matches backend rate limit)
  const [resendCooldown, setResendCooldown] = useState(30);

  // 5-minute total expiry countdown
  const [expiresIn, setExpiresIn] = useState(300);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyOtp({
        email: form.email.trim(),
        otp: form.otp.trim(),
      });
      setSuccess(response.message || 'Email successfully verified. Redirecting to login...');
      setTimeout(() => {
        navigate('/auth', {
          state: {
            message: 'Email successfully verified. Please sign in.',
            email: form.email.trim(),
          },
        });
      }, 1200);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Verification failed. Code may be invalid or expired.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !form.email.trim() || isResending) return;

    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const res = await resendOtp(form.email.trim());
      setSuccess(res.message || 'A new verification code has been dispatched to your email.');
      setResendCooldown(30);
      setExpiresIn(300);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Unable to resend verification code. Please wait before attempting again.',
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E293B] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B] text-white">
            <KeyRound size={22} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Verify Your Email</h1>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Enter the 6-digit one-time password (OTP) sent to your registered address to activate your account.
          </p>
        </div>

        {/* Code Expiry Status */}
        <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#1E293B]/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#94A3B8]">
            <Clock size={14} />
            <span>Code Validity:</span>
          </div>
          <span
            className={`font-mono font-semibold ${
              expiresIn < 60 ? 'text-[#DC2626]' : 'text-white'
            }`}
          >
            {expiresIn > 0 ? formatTime(expiresIn) : 'Expired'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8]" htmlFor="verify-email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-[#94A3B8] pointer-events-none" />
              <input
                id="verify-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="analyst@domain.com"
                required
                className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#64748B] focus:border-[#F8FAFC] focus:outline-none transition sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8]" htmlFor="verify-otp">
              6-Digit Verification Code
            </label>
            <input
              id="verify-otp"
              type="text"
              value={form.otp}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  otp: e.target.value.replace(/\D/g, '').slice(0, 6),
                }))
              }
              placeholder="000000"
              maxLength={6}
              required
              className="w-full text-center font-mono tracking-[0.4em] text-lg font-bold rounded-lg border border-[#334155] bg-[#1E293B] py-2.5 px-3 text-white placeholder-[#64748B] focus:border-[#F8FAFC] focus:outline-none transition"
            />
          </div>

          {error && <ErrorMessage message={error} />}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || expiresIn <= 0}
            className="primary-button w-full py-2.5 text-sm font-semibold"
          >
            {isSubmitting ? 'Verifying Code...' : 'Confirm Verification'}
          </button>
        </form>

        {/* Resend Controls */}
        <div className="border-t border-[#334155] pt-4 text-center">
          <p className="text-xs text-[#94A3B8]">
            Did not receive the code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-[#64748B]">
                Resend available in <span className="font-mono">{resendCooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-white hover:underline inline-flex items-center gap-1"
              >
                {isResending ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend Code'
                )}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
