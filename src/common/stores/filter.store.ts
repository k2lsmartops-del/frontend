import { create } from 'zustand';

type PeriodFilter = 'today' | 'month' | 'quarter' | 'year';

interface FilterState {
  period: PeriodFilter;
  setPeriod: (period: PeriodFilter) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  period: 'today',
  setPeriod: (period) => set({ period }),
}));
