import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, Bell, Mail as MailIcon, User, Building2, Briefcase } from 'lucide-react';
import FormInput from '../../components/common/formInput';
import Button from '../../components/common/button';
import PhotoDropzone from '../../components/common/photoDropzone';
import { useAuth } from '../../context/authContext';
import { supabase } from '../../lib/supabaseClient';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();

  const [form, setForm] = useState({ fullName: '', bio: '', affiliation: '', workField: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  const [notifications, setNotifications] = useState({
    email: true,
    submissionUpdates: true,
    reviewReminders: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name || '',
        bio: profile.bio || '',
        affiliation: profile.affiliation || '',
        workField: profile.work_field || '',
      });
      setAvatarUrl(profile.avatar_url || '');
      if (profile.notification_preferences) {
        setNotifications((prev) => ({ ...prev, ...profile.notification_preferences }));
      }
    }
  }, [profile]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('colloquium-theme', next ? 'dark' : 'light');
  };

  const handleAvatarChange = async (file, previewUrl) => {
    setAvatarUrl(previewUrl);
    if (!file || !user) return;

    setUploading(true);
    const filePath = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setSaveMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(publicUrlData.publicUrl);
    await updateProfile({ avatar_url: publicUrlData.publicUrl });
    setUploading(false);
    setSaveMessage('Profile photo updated.');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    const { error } = await updateProfile({
      full_name: form.fullName,
      bio: form.bio,
      affiliation: form.affiliation,
      work_field: form.workField,
    });
    setSaving(false);
    setSaveMessage(error ? error.message : 'Profile saved successfully.');
  };

  const handleToggleNotification = async (key) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    await updateProfile({ notification_preferences: next });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Account settings
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Manage your profile, preferences, and account security.
      </p>

      {/* Profile card */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Profile information
        </h2>

        <div className="mt-5">
          <PhotoDropzone previewUrl={avatarUrl} size="lg" onChange={handleAvatarChange} />
          {uploading && (
            <p className="mt-2 text-xs font-medium text-primary-600">Uploading photo…</p>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
          <FormInput
            label="Full name"
            name="fullName"
            icon={User}
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          />
          <FormInput
            label="Professional affiliation"
            name="affiliation"
            icon={Building2}
            value={form.affiliation}
            onChange={(e) => setForm((p) => ({ ...p, affiliation: e.target.value }))}
          />
          <FormInput
            label="Field of work"
            name="workField"
            icon={Briefcase}
            value={form.workField}
            onChange={(e) => setForm((p) => ({ ...p, workField: e.target.value }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Bio
            </label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell reviewers a little about your research interests."
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <FormInput label="Email address" name="email" icon={MailIcon} value={user?.email || ''} onChange={() => {}} />

          {saveMessage && (
            <p className="text-sm font-medium text-primary-600">{saveMessage}</p>
          )}

          <Button type="submit" loading={saving} className="sm:w-auto">
            Save changes
          </Button>
        </form>
      </section>

      {/* Preferences card */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Preferences</h2>

        <div className="mt-4 flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-5 w-5 text-slate-500" /> : <Sun className="h-5 w-5 text-slate-500" />}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Dark mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between light and dark appearance.
              </p>
            </div>
          </div>
          <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Email notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive general updates via email.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={notifications.email}
            onChange={() => handleToggleNotification('email')}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Submission status updates</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get notified when a submission changes status.
            </p>
          </div>
          <ToggleSwitch
            checked={notifications.submissionUpdates}
            onChange={() => handleToggleNotification('submissionUpdates')}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Review reminders</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reminders for upcoming review deadlines.
            </p>
          </div>
          <ToggleSwitch
            checked={notifications.reviewReminders}
            onChange={() => handleToggleNotification('reviewReminders')}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Session</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Log out of Colloquium on this device.
        </p>
        <Button variant="danger" icon={LogOut} onClick={handleLogout} className="mt-4 sm:w-auto">
          Log out
        </Button>
      </section>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}