import Badge from './Badge';

interface ActivesBadgesProps {
  actives: string[];
  max?: number;
}

export default function ActivesBadges({ actives = [], max = 3 }: ActivesBadgesProps) {
  const shown = actives.slice(0, max);
  const rest = actives.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(a => <Badge key={a} color="sage" size="xs">{a}</Badge>)}
      {rest > 0 && <Badge color="stone" size="xs">+{rest} more</Badge>}
    </div>
  );
}
