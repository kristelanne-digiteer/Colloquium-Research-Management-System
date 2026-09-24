import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import AuthLayout from '../../components/auth/authLayout';
import PinInput from '../../components/common/pinInput';
import FormInput from '../../components/common/formInput';
import Button from '../../components/common/button';
import { useAuth } from '../../context/authContext';

const RESEND_SECONDS = 60;

export default function ResetPin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyRecoveryOtp, sendPasswordResetOtp, updatePassword } = useAuth();

  const email = location.state?.email;
  const [step, setStep] = useState('code'); // 'code' | 'password'
  const [pin, setPin] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrors({});

    if (pin.length !== 5) {
      setErrors({ pin: 'Enter the 5-digit code sent to your email.' });
      return;
    }

    setLoading(true);
    const { error } = await verifyRecoveryOtp({ email, token: pin });
    setLoading(false);

    if (error) {
      setErrors({ pin: error.message });
      return;
    }

    setStep('password');
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    const nextErrors = {};
    if (passwords.password.length < 8)
      nextErrors.password = 'Password must be at least 8 characters.';
    if (passwords.confirmPassword !== passwords.password)
      nextErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    const { error } = await updatePassword({ password: passwords.password });
    setLoading(false);

    if (error) {
      setErrors({ password: error.message });
      return;
    }

    navigate('/reset-success');
  };

  const handleResend = async () => {
    setResendMessage('');
    setResending(true);
    const { error } = await sendPasswordResetOtp({ email });
    setResending(false);

    if (error) {
      setErrors({ pin: error.message });
      return;
    }

    setResendMessage('A new code has been sent.');
    setSecondsLeft(RESEND_SECONDS);
  };

  if (step === 'password') {
    return (
      <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account.">
        <form onSubmit={handleSetPassword} className="space-y-4">
          <FormInput
            label="New password"
            name="password"
            type="password"
            icon={Lock}
            placeholder="At least 8 characters"
            value={passwords.password}
            onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <FormInput
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            icon={Lock}
            placeholder="Re-enter your password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />
          <Button type="submit" loading={loading}>
            Reset password
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Enter reset code"
      subtitle={
        email
          ? `Enter the 5-digit code we sent to ${email}.`
          : 'Enter the 5-digit code we sent to your email.'
      }
    >
      <form onSubmit={handleVerifyCode} className="space-y-6">
        <PinInput length={5} value={pin} onChange={setPin} error={errors.pin} />

        {resendMessage && (
          <p className="text-center text-sm font-medium text-green-600">{resendMessage}</p>
        )}

        <Button type="submit" loading={loading}>
          Continue
        </Button>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          {secondsLeft > 0 ? (
            <span>
              Resend code in <span className="font-semibold text-slate-700 dark:text-slate-300">{secondsLeft}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-60"
            >
              {resending ? 'Sending…' : "Didn't get a code? Resend"}
            </button>
          )}
        </div>

        <Link
          to="/forgot-password"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </form>
    </AuthLayout>
  );
}