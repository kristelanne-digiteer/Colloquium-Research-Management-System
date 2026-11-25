import { useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap, Plus, Search, X } from 'lucide-react';
import SelectField from './selectField';
import { TRACK_GROUPS, groupOfTrack } from '../../lib/options';

const MAX_TRACKS = 6;
const GROUP_NAMES = TRACK_GROUPS.map((g) => g.group);
const itemsOf = (group) => TRACK_GROUPS.find((g) => g.group === group)?.options ?? [];
const flatten = (rows) => [...new Set(rows.flatMap((r) => r.items))];
const sameSet = (a, b) => a.length === b.length && [...a].sort().join('\u0000') === [...b].sort().join('\u0000');

// Saved value is a flat list of checked fields ("Computer Engineering", ...).
// Rows rebuild it by group: Track 1 = a group, then tick the fields under it.
function rowsFromValue(value) {
  const items = [...new Set((value ?? []).map((v) => String(v).trim()).filter(Boolean))];
  const byGroup = new Map();
  items.forEach((item) => {
    const g = groupOfTrack(item);
    byGroup.set(g, [...(byGroup.get(g) ?? []), item]);
  });
  const rows = [...byGroup.entries()].map(([group, its]) => ({ group, items: its }));
  return rows.length ? rows : [{ group: '', items: [] }];
}

function TrackRow({ index, row, otherGroups, canRemove, onGroup, onToggle, onSetAll, onRemove }) {
  const [q, setQ] = useState('');
  const all = useMemo(() => itemsOf(row.group), [row.group]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((o) => o.toLowerCase().includes(needle)) : all;
  }, [all, q]);

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <SelectField
            label={`Track ${index + 1}`}
            name={`expertise-track-${index + 1}`}
            icon={GraduationCap}
            value={row.group}
            onChange={(e) => { setQ(''); onGroup(e.target.value); }}
            options={GROUP_NAMES}
            placeholder="Select a field area (e.g. Engineering)"
            disabledValues={otherGroups}
            compact
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove track ${index + 1}`}
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {row.group && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tick your expertise under {row.group} <span className="text-slate-400">({row.items.length} selected)</span>
            </p>
            <div className="flex gap-3 text-xs font-semibold">
              <button type="button" onClick={() => onSetAll(shown)} className="text-primary-600 hover:underline">Select shown</button>
              <button type="button" onClick={() => onSetAll([])} className="text-slate-500 hover:underline">Clear</button>
            </div>
          </div>

          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder={`Search in ${row.group}...`}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <ul className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-slate-400">No matches for &ldquo;{q}&rdquo;</li>}
            {shown.map((opt) => {
              const checked = row.items.includes(opt);
              return (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/50">
                    <input type="checkbox" checked={checked} onChange={() => onToggle(opt)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    {opt}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ExpertiseTracks({ value, onChange }) {
  const [rows, setRows] = useState(() => rowsFromValue(value));
  const last = useRef(flatten(rows));

  // Profile loads after the page opens: rebuild the rows when the saved value changes from outside.
  useEffect(() => {
    const incoming = [...new Set((value ?? []).map((v) => String(v).trim()).filter(Boolean))];
    if (!sameSet(incoming, last.current)) {
      const next = rowsFromValue(incoming);
      setRows(next);
      last.current = flatten(next);
    }
  }, [value]);

  const commit = (next) => {
    setRows(next);
    const flat = flatten(next);
    last.current = flat;
    onChange(flat);
  };

  const update = (i, patch) => commit(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Field of expertise</label>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <TrackRow
            key={i}
            index={i}
            row={row}
            otherGroups={rows.filter((_, j) => j !== i).map((r) => r.group).filter(Boolean)}
            canRemove={i > 0}
            onGroup={(group) => update(i, { group, items: [] })}
            onToggle={(opt) => update(i, { items: row.items.includes(opt) ? row.items.filter((x) => x !== opt) : [...row.items, opt] })}
            onSetAll={(list) => update(i, { items: list })}
            onRemove={() => commit(rows.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      {rows.length < MAX_TRACKS && (
        <button type="button" onClick={() => setRows((r) => [...r, { group: '', items: [] }])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">
          <Plus className="h-4 w-4" />
          Add track
        </button>
      )}
    </div>
  );
}
