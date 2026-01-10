import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Family } from "@/lib/families";

interface FamilyState {
  currentFamily: Family | null;
  setCurrentFamily: (family: Family | null) => void;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      currentFamily: null,
      setCurrentFamily: (family) => set({ currentFamily: family }),
      clearFamily: () => set({ currentFamily: null }),
    }),
    {
      name: "entmoot-family",
    }
  )
);
