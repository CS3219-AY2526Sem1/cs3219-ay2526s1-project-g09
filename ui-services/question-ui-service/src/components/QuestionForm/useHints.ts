import { useState } from "react";

export function useHints(initial: string[] = [""]) {
  const [hints, setHints] = useState(initial);

  const add = () => setHints((prev) => [...prev, ""]);
  const remove = (i: number) =>
    setHints((prev) => prev.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) =>
    setHints((prev) => prev.map((h, idx) => (idx === i ? v : h)));

  const cleaned = hints.map((h) => h.trim()).filter(Boolean);

  return { hints, add, remove, update, cleaned };
}
