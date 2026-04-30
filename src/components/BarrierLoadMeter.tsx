import Badge from './Badge';
import { barrierLoadLabel } from '../store/data';

const BAR_COLORS: Record<string, string> = {
  sage:   'bg-sage-400',
  cream:  'bg-amber-300',
  yellow: 'bg-amber-400',
  terra:  'bg-terra-400',
};

interface BarrierLoadMeterProps {
  score: number;
  showLabel?: boolean;
}

export default function BarrierLoadMeter({ score, showLabel = true }: BarrierLoadMeterProps) {
  const { label, color } = barrierLoadLabel(score);
  const max = 8;
  const pct = Math.min(score / max, 1);

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-500 dark:text-stone-400">Barrier Load</span>
          <Badge color={color as 'sage' | 'cream' | 'yellow' | 'terra'}>{label}</Badge>
        </div>
      )}
      <div className="h-1.5 bg-stone-100 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[color]}`}
          style={{ width: `${Math.max(pct * 100, 4)}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-stone-400 dark:text-stone-500">Score {score}/{max}</p>}
    </div>
  );
}
