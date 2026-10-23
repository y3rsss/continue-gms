import { useEffect } from "react";

const useArrowKeys = (onLeft: () => void, onRight: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      // a focused slider or text field uses the arrows itself
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") onLeft();
      if (event.key === "ArrowRight") onRight();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onLeft, onRight, enabled]);
};

export default useArrowKeys;
