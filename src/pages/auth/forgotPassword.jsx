import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthLayout from '../../components/auth/authLayout';
import FormInput from '../../components/common/formInput';
import Button from '../../components/common/button';
import { useAuth } from '../../context/authContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { sendPasswordResetOtp } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await sendPasswordResetOtp({ email });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    navigate('/reset-pin', { state: { email } });
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a code to reset it."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email address"
          name="email"
          type="email"
          icon={Mail}
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoComplete="email"
          required
        />

        <Button type="submit" loading={loading}>
          Send reset code
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 pt-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to log in
        </Link>
      </form>
    </AuthLayout>
  );
}