import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'offline' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  persistent: boolean;
  /** Affiche un toast. Si `persistent`, il reste jusqu'à fermeture manuelle. */
  show: (message: string, type?: ToastType, persistent?: boolean) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout>;

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  persistent: false,

  show: (message, type = 'info', persistent = false) => {
    clearTimeout(timer);
    set({ message, type, visible: true, persistent });
    if (!persistent) {
      timer = setTimeout(() => set({ visible: false }), 2800);
    }
  },

  hide: () => {
    clearTimeout(timer);
    set({ visible: false });
  },
}));
