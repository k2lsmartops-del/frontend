import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

interface FormCardProps {
  title: string;
  icon: IconType;
  children: ReactNode;
}

export default function FormCard({ title, icon: Icon, children }: FormCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="mb-3.5 flex items-center gap-2 font-head text-[13px] font-semibold text-k2l-navy">
        <Icon className="text-base" />
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
