import { useToastStore } from '@/common/stores/toast.store';
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiWifiOffLine,
  RiInformationLine,
} from '@/common/icons';

const ICONS = {
  success: RiCheckboxCircleLine,
  error: RiErrorWarningLine,
  offline: RiWifiOffLine,
  info: RiInformationLine,
};

const BG: Record<string, string> = {
  success: 'bg-k2l-success',
  error: 'bg-k2l-red',
  offline: 'bg-[#854F0B]',
  info: 'bg-k2l-gray-900',
};

export default function Toast() {
  const { message, type, visible } = useToastStore();
  const Icon = ICONS[type];

  return (
    <div
      className={`pointer-events-none fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-[13px] font-medium text-white shadow-lg transition-all duration-300 ${BG[type]} ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
