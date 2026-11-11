const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500 border-transparent',
  secondary:
    'border-secondary-500 text-secondary-500 hover:bg-accent-300 hover:text-primary-600 dark:text-secondary-300 dark:border-secondary-600',
  accent: 'bg-accent-300 text-primary-600 hover:bg-accent-400 border-transparent',
};

export default function ChairButton({ variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
