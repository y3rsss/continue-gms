import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const EditionToggle = () => {
  const [night, setNight] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = () => {
    const next = !night;
    setNight(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("continue.edition", next ? "night" : "day");
    } catch {
      // not persisted
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={night ? "Switch to day edition" : "Switch to night edition"}
      className="label inline-flex items-center gap-2 border-[1.5px] border-ink px-2.5 py-2 hover:bg-tint"
    >
      {night ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      <span className="hidden md:inline">{night ? "Day edition" : "Night edition"}</span>
    </button>
  );
};

export default EditionToggle;
