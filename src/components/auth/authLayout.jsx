import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen w-full bg-surface-muted dark:bg-surface-dark">
      {/* Branding panel — hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Colloquium</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Conference Submission &amp; Peer Review, streamlined.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-100">
            Manage submissions, coordinate reviewers, and track decisions in one
            connected research management workspace.
          </p>
        </div>

        <p className="text-xs text-primary-200">
          © {new Date().getFullYear()} Colloquium. All rights reserved.
        </p>

        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Colloquium
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}