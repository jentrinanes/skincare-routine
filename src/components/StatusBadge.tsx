import Badge from './Badge';
import type { ProductStatus } from '../types';

const STATUS_MAP: Record<ProductStatus, { color: 'sage' | 'stone' | 'cream'; label: string }> = {
  active:   { color: 'sage',  label: 'Active' },
  unopened: { color: 'stone', label: 'Unopened' },
  finished: { color: 'cream', label: 'Finished' },
};

export default function StatusBadge({ status }: { status: ProductStatus }) {
  const { color, label } = STATUS_MAP[status] ?? { color: 'stone', label: status };
  return <Badge color={color}>{label}</Badge>;
}
