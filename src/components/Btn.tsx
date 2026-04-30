import type { ButtonHTMLAttributes } from 'react';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}

const VARIANTS: Record<BtnVariant, string> = {
  primary:   'bg-sage-500 hover:bg-sage-600 text-white shadow-sm',
  secondary: 'bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300',
  ghost:     'hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-400',
  danger:    'bg-terra-400 hover:bg-terra-500 text-white',
  outline:   'border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-stone-300',
};

const SIZES: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export default function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
