import { FileText, Plus } from 'lucide-react';
import Button from '../../components/common/button';

export default function MySubmissions() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
            My Submissions
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Track the papers you've submitted for review.
          </p>
        </div>
        <Button icon={Plus} className="w-auto">
          New submission
        </Button>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
        <FileText className="h-10 w-10 text-secondary-300" />
        <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">
          You haven't submitted any papers yet.
        </p>
        <p className="mt-1 text-sm text-secondary-400">
          Start a new submission to see it listed here.
        </p>
      </div>
    </div>
  );
}