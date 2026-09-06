import { create } from "zustand";
import { getTourSteps, type TourLanguage } from "@/constants/tour-steps";

const SEEN_KEY = "billing_erp_tour_seen";

interface TourState {
  choosingLanguage: boolean;
  active: boolean;
  language: TourLanguage;
  stepIndex: number;
  start: () => void;
  chooseLanguage: (language: TourLanguage) => void;
  next: () => void;
  prev: () => void;
  end: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  choosingLanguage: false,
  active: false,
  language: "en",
  stepIndex: 0,
  start: () => set({ choosingLanguage: true, active: false, stepIndex: 0 }),
  chooseLanguage: (language) => set({ choosingLanguage: false, active: true, language, stepIndex: 0 }),
  next: () => {
    const { stepIndex, language } = get();
    if (stepIndex >= getTourSteps(language).length - 1) {
      get().end();
      return;
    }
    set({ stepIndex: stepIndex + 1 });
  },
  prev: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  end: () => {
    set({ active: false, choosingLanguage: false, stepIndex: 0 });
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — non-critical, just skip persisting.
    }
  },
}));

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}
