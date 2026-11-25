import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

// Searchable dropdown. Same props as the old native <select>, so callers did not change:
// click it (or tab into it) and just start typing to filter, Arrow keys + Enter to pick.
// onChange is called with an event-like object: onChange({ target: { name, value } }).
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
  clearable = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const allOptions = useMemo(
    () => (groups ? groups.flatMap((g) => g.options) : options),
    [groups, options]
  );

  // Flat list of what is currently visible, with a group label attached to the first item of each group.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (o) => !q || o.toLowerCase().includes(q);
    const rows = [];
    if (groups) {
      groups.forEach((g) => {
        const opts = g.options.filter(match);
        opts.forEach((o, i) => rows.push({ option: o, group: i === 0 ? g.group : null, key: `${g.group}-${o}` }));
      });
    } else {
      options.filter(match).forEach((o) => rows.push({ option: o, group: null, key: o }));
    }
    // Keep a value that is saved but no longer in the list selectable.
    if (value && !allOptions.includes(value) && match(value)) rows.unshift({ option: value, group: null, key: `unknown-${value}` });
    return rows;
  }, [query, groups, options, value, allOptions]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const openList = () => {
    if (open) return;
    const idx = visible.findIndex((r) => r.option === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const select = (option) => {
    if (disabledValues.includes(option)) return;
    onChange?.({ target: { name, value: option } });
    close();
  };

  // Click outside closes the list.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted row in view while using the arrow keys.
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) return openList();
      setActive((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return openList();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault(); // do not submit the form while picking
        if (visible[active]) select(visible[active].option);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        close();
      }
    } else if (e.key === 'Tab') {
      close();
    }
  };

  const labelClass = compact
    ? 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'
    : 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <div ref={wrapRef}>
      {label && (
        <label htmlFor={name} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={name}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          // While open you type to search; when closed it shows the chosen value.
          value={open ? query : value || ''}
          placeholder={open && value ? value : placeholder}
          onFocus={openList}
          onClick={openList}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`w-full rounded-xl border bg-white py-3 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-800 ${
            Icon ? 'pl-11' : 'pl-3.5'
          } ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
              : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/40 dark:border-slate-700'
          } text-slate-900 dark:text-slate-100`}
        />
        {/* Keeps native "required" validation working, since the visible box can be empty while typing. */}
        {required && (
          <input
            tabIndex={-1}
            aria-hidden="true"
            required
            value={value || ''}
            onChange={() => {}}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        )}
        {clearable && value && !open && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => onChange?.({ target: { name, value: '' } })}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close list' : 'Open list'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (open ? close() : openList())}
          className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {visible.length === 0 && (
              <li className="flex items-center gap-2 px-3.5 py-3 text-slate-400">
                <Search className="h-4 w-4" /> No matches for &ldquo;{query}&rdquo;
              </li>
            )}
            {visible.map((row, idx) => {
              const disabled = disabledValues.includes(row.option);
              const selected = row.option === value;
              return (
                <li key={row.key} role="presentation">
                  {row.group && (
                    <div className="px-3.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {row.group}
                    </div>
                  )}
                  <div
                    role="option"
                    aria-selected={selected}
                    aria-disabled={disabled}
                    data-idx={idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(row.option)}
                    onMouseEnter={() => setActive(idx)}
                    className={`px-3.5 py-2 ${
                      disabled
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                        : 'cursor-pointer text-slate-900 dark:text-slate-100'
                    } ${idx === active && !disabled ? 'bg-primary-50 dark:bg-slate-700' : ''} ${
                      selected ? 'font-semibold text-primary-600 dark:text-primary-400' : ''
                    }`}
                  >
                    {row.option}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
