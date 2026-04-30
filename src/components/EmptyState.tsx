import Icon from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-sage-50 dark:bg-sage-900/20 flex items-center justify-center text-sage-400 mb-4">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{title}</h3>
      <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
