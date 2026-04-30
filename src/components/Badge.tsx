type BadgeColor = 'sage' | 'terra' | 'stone' | 'yellow' | 'blue' | 'cream' | 'red';
type BadgeSize = 'xs' | 'sm';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
}

const COLORS: Record<BadgeColor, string> = {
  sage:  'bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300',
  terra: 'bg-terra-100 text-terra-600 dark:bg-terra-900/40 dark:text-terra-300',
  stone: 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-stone-400',
  yellow:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cream: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  red:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const SIZES: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
};

export default function Badge({ children, color = 'sage', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${COLORS[color]} ${SIZES[size]}`}>
      {children}
    </span>
  );
}
