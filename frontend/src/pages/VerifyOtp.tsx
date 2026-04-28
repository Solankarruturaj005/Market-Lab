import { LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { verifyOtp } from '../services/authService';

interface VerifyOtpLocationState {
  email?: string;
}

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VerifyOtpLocationState | null;
  const [form, setForm] = useState({ email: state?.email ?? '', otp: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await verifyOtp(form);
      setSuccess(response.message);
      setTimeout(() => {
        navigate('/auth', { state: { message: response.message, email: form.email } });
      }, 1200);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'OTP verification failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="card w-full p-8 sm:p-10">
          <div>
            <h2 className="text-2xl font-semibold text-white">Verify your email</h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter the 6-digit OTP sent to your email to activate your account.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="field">
              <Mail size={18} className="text-slate-500" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email address"
                className="field-input"
                required
              />
            </label>

            <label className="field">
              <LockKeyhole size={18} className="text-slate-500" />
              <input
                value={form.otp}
                onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))}
                placeholder="6-digit OTP"
                className="field-input"
                maxLength={6}
                required
              />
            </label>

            {error ? <ErrorMessage message={error} /> : null}
            {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

            <button type="submit" disabled={isSubmitting} className="primary-button w-full">
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
