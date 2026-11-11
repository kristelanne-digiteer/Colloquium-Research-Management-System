import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/auth/authLayout';
import FormInput from '../../components/common/formInput';
import Button from '../../components/common/button';
import PinInput from '../../components/common/pinInput';
import { useAuth } from '../../context/authContext';

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout title="" subtitle="">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Password reset successful
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your password has been updated. You can now log in with your new password.
        </p>

        <div className="mt-8 w-full">
          <Button onClick={() => navigate('/login', { replace: true })}>
            Continue to log in
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}