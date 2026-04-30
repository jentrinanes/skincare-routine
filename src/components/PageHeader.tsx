interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{title}</h1>
        {subtitle && <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
