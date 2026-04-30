interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export default function FormField({ label, required, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
        {label}{required && <span className="text-terra-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-400 dark:text-stone-500">{hint}</p>}
    </div>
  );
}

export const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow';
