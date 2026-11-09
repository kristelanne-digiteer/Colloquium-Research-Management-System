import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

const tones = {
  default: 'text-secondary-700 hover:bg-secondary-50 dark:text-secondary-200 dark:hover:bg-secondary-800',
  success: 'text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
};

// actions: [{ label, icon, onClick, tone? }, { divider: true }]
// Menu is position: fixed so it is never clipped by the table's overflow wrapper.
export default function ActionMenu({ actions }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = () => {
    if (open) return setPos(null);
    const r = btnRef.current.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    setPos(
      window.innerHeight - r.bottom < 300
        ? { bottom: window.innerHeight - r.top + 4, right }
        : { top: r.bottom + 4, right }
    );
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Actions"
        className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={pos}
          className="fixed z-40 w-52 rounded-xl border border-secondary-200 bg-white py-1.5 shadow-card dark:border-secondary-700 dark:bg-secondary-900"
        >
          {actions.map((a, i) =>
            a.divider ? (
              <div key={i} className="my-1 border-t border-secondary-200 dark:border-secondary-800" />
            ) : (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  setPos(null);
                  a.onClick();
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium ${tones[a.tone || 'default']}`}
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}
