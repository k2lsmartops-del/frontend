import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'offline' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout>;

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,

  show: (message, type = 'info') => {
    clearTimeout(timer);
    set({ message, type, visible: true });
    timer = setTimeout(() => set({ visible: false }), 2800);
  },

  hide: () => {
    clearTimeout(timer);
    set({ visible: false });
  },
}));
