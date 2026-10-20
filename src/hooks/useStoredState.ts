import { useState } from "react";

const useStoredState = <T extends string>(key: string, fallback: T, allowed: readonly T[]) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return allowed.includes(stored as T) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  });

  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // not persisted, still applies for this session
    }
  };

  return [value, update] as const;
};

export default useStoredState;
