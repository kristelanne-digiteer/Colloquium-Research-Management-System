import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuthLayout from '../../components/auth/authLayout';
import FormInput from '../../components/common/formInput';
import Button from '../../components/common/button';
import PinInput from '../../components/common/pinInput';
import { useAuth } from '../../context/authContext';
import { supabase } from '../../lib/supabaseClient';

const RESEND_SECONDS = 60;

export default function VerifyPin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifySignupOtp, resendSignupOtp, updateProfile } = useAuth();

  const email = location.state?.email;
  const photoFile = location.state?.photoFile;

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 5) {
      setError('Enter the 5-digit code sent to your email.');
      return;
    }

    setLoading(true);
    const { error: verifyError } = await verifySignupOtp({ email, token: pin });

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    if (photoFile) {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (uid) {
        const filePath = `${uid}/avatar-${Date.now()}.${photoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile, { upsert: true });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          await updateProfile({ avatar_url: publicUrlData.publicUrl });
        }
      }
    }

    setLoading(false);
    navigate('/', { replace: true });
  };

  const handleResend = async () => {
    setResendMessage('');
    setResending(true);
    const { error: resendError } = await resendSignupOtp({ email });
    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResendMessage('A new code has been sent.');
    setSecondsLeft(RESEND_SECONDS);
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email
          ? `Enter the 5-digit code we sent to ${email}.`
          : 'Enter the 5-digit code we sent to your email.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <PinInput length={5} value={pin} onChange={setPin} error={error} />

        {resendMessage && (
          <p className="text-center text-sm font-medium text-green-600">{resendMessage}</p>
        )}

        <Button type="submit" loading={loading}>
          Verify account
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
          to="/signup"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign up
        </Link>
      </form>
    </AuthLayout>
  );
}