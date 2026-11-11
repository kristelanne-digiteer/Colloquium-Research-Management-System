import { ChevronDown } from 'lucide-react';

export default function SelectField({
  label,
  name,
  icon: Icon,
  value,
  onChange,
  options = [],
  groups,
  placeholder = 'Select an option',
  error,
  required,
  disabledValues = [],
  compact = false,
}) {
  const allOptions = groups ? groups.flatMap((g) => g.options) : options;
  const hasUnknownValue = value && !allOptions.includes(value);
  const optionClass = 'text-slate-900 dark:text-slate-100';
  const renderOption = (option, key) => (
    <option
      key={key}
      value={option}
      disabled={disabledValues.includes(option)}
      className={optionClass}
    >
      {option}
    </option>
  );

  return (
    <div>
      {label && (
        <label
          htmlFor={name}
          className={
            compact
              ? 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'
              : 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'
          }
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full appearance-none rounded-xl border bg-white py-3 pr-10 text-sm focus:outline-none focus:ring-2 dark:bg-slate-800 ${
            Icon ? 'pl-11' : 'pl-3.5'
          } ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
              : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/40 dark:border-slate-700'
          } ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
        >
          <option value="" className={optionClass}>
            {placeholder}
          </option>
          {hasUnknownValue && (
            <option value={value} className={optionClass}>
              {value}
            </option>
          )}
          {groups
            ? groups.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((option) => renderOption(option, `${g.group}-${option}`))}
                </optgroup>
              ))
            : options.map((option) => renderOption(option, option))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
