interface FormInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

export default function FormInput({ label, value, onChange, placeholder, type = 'text' }: FormInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-k2l-gray-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border-[1.5px] border-k2l-gray-200 bg-white px-3.5 py-3 font-body text-[15px] text-k2l-gray-900 outline-none transition-colors focus:border-k2l-primary"
      />
    </div>
  );
}
