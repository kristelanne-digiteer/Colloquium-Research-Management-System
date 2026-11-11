import { GraduationCap, Plus, X } from 'lucide-react';
import SelectField from './selectField';
import { EXPERTISE_OPTIONS } from '../../lib/options';

const MAX_TRACKS = 6;

export default function ExpertiseTracks({ value, onChange }) {
  const tracks = value && value.length > 0 ? value : [''];

  const handleChange = (index, next) => {
    onChange(tracks.map((t, i) => (i === index ? next : t)));
  };

  const handleAdd = () => {
    if (tracks.length < MAX_TRACKS) onChange([...tracks, '']);
  };

  const handleRemove = (index) => {
    onChange(tracks.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Field of expertise
      </label>

      <div className="space-y-3">
        {tracks.map((track, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <SelectField
                label={`Track ${index + 1}`}
                name={`expertise-track-${index + 1}`}
                icon={GraduationCap}
                value={track}
                onChange={(e) => handleChange(index, e.target.value)}
                options={EXPERTISE_OPTIONS}
                placeholder="Select an area of expertise"
                disabledValues={tracks.filter((_, i) => i !== index)}
                compact
              />
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Remove track ${index + 1}`}
                className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {tracks.length < MAX_TRACKS && (
        <button
          type="button"
          onClick={handleAdd}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add track
        </button>
      )}
    </div>
  );
}
