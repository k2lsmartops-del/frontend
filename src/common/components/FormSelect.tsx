interface FormSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { label: string; value: string })[];
}

export default function FormSelect({ label, value, onChange, options }: FormSelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-k2l-gray-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border-[1.5px] border-k2l-gray-200 bg-white px-3.5 py-3 font-body text-[15px] text-k2l-gray-900 outline-none transition-colors focus:border-k2l-primary"
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}
