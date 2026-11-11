import { useRef } from 'react';

export default function PinInput({ length = 5, value, onChange, error }) {
  const inputsRef = useRef([]);

  const handleChange = (index, rawValue) => {
    const digit = rawValue.replace(/[^0-9]/g, '').slice(-1);
    const nextValue = value.split('');
    nextValue[index] = digit;
    const joined = nextValue.join('').slice(0, length);
    onChange(joined);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div>
      <div className="flex justify-center gap-3">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`h-14 w-12 rounded-xl border text-center text-xl font-semibold text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-800 dark:text-slate-100 sm:h-16 sm:w-14 ${
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-300 focus:border-primary-500 dark:border-slate-700'
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-3 text-center text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}