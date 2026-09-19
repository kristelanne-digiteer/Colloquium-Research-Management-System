import { Bell } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
        Notifications
      </h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Updates on your submissions and review activity.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
        <Bell className="h-10 w-10 text-secondary-300" />
        <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">
          You're all caught up.
        </p>
      </div>
    </div>
  );
}