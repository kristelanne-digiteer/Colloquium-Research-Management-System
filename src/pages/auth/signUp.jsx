import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, BookOpen, Phone } from 'lucide-react';
import AuthLayout from '../../components/auth/authLayout';
import FormInput from '../../components/common/formInput';
import Button from '../../components/common/button';
import PhotoDropzone from '../../components/common/photoDropzone';
import { useAuth } from '../../context/authContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    affiliation: '',
    fieldOfStudy: '',
    phone: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password)
      nextErrors.confirmPassword = 'Passwords do not match.';
    if (!form.affiliation.trim())
      nextErrors.affiliation = 'Professional affiliation is required.';
    if (!form.fieldOfStudy.trim()) nextErrors.fieldOfStudy = 'Field of study is required.';
    if (!/^[0-9+()\-\s]{7,20}$/.test(form.phone)) nextErrors.phone = 'Enter a valid phone number.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    if (!agreed) {
      setFormError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      affiliation: form.affiliation,
      fieldOfStudy: form.fieldOfStudy,
      phone: form.phone,
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    navigate('/verify-pin', { state: { email: form.email, photoFile } });
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setFormError(error.message);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Colloquium to submit papers and take part in peer review."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Full name"
          name="fullName"
          icon={User}
          placeholder="Juan Dela Cruz"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoComplete="name"
          required
        />
        <FormInput
          label="Email address"
          name="email"
          type="email"
          icon={Mail}
          placeholder="you@university.edu"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
          required
        />
        <FormInput
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="At least 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <FormInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />
        <FormInput
          label="Professional affiliation"
          name="affiliation"
          icon={Building2}
          placeholder="University or organization"
          value={form.affiliation}
          onChange={handleChange}
          error={errors.affiliation}
          autoComplete="organization"
          required
        />
        <FormInput
          label="Field of study"
          name="fieldOfStudy"
          icon={BookOpen}
          placeholder="e.g. Computer Science"
          value={form.fieldOfStudy}
          onChange={handleChange}
          error={errors.fieldOfStudy}
          required
        />
        <FormInput
          label="Phone number"
          name="phone"
          type="tel"
          icon={Phone}
          placeholder="+63 9XX XXX XXXX"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          autoComplete="tel"
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Profile photo <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <PhotoDropzone
            previewUrl={photoPreview}
            onChange={(file, previewUrl) => {
              setPhotoFile(file);
              setPhotoPreview(previewUrl);
            }}
          />
        </div>

        <label className="flex items-start gap-2.5 pt-1 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            I agree to the <span className="font-medium text-primary-600">Terms of Service</span>{' '}
            and <span className="font-medium text-primary-600">Privacy Policy</span>.
          </span>
        </label>

        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/40">
            {formError}
          </p>
        )}

        <Button type="submit" loading={loading}>
          Create account
        </Button>

        <div className="relative py-2 text-center">
          <span className="relative z-10 bg-surface-muted px-3 text-xs font-medium uppercase tracking-wide text-slate-400 dark:bg-surface-dark">
            Or continue with
          </span>
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200 dark:bg-slate-700" />
        </div>

        <Button variant="secondary" type="button" loading={googleLoading} onClick={handleGoogleSignUp}>
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          Sign up with Google
        </Button>

        <p className="pt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}