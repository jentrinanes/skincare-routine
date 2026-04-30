import { inputCls } from './FormField';

type SelectOption = string | { value: string; label: string };

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}
