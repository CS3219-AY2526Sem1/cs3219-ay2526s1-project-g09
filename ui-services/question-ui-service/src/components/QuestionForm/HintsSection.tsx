import React from "react";
import { Button } from "@/components/ui/button";

interface HintsSectionProps {
  hints: string[];
  add: () => void;
  remove: (i: number) => void;
  update: (i: number, v: string) => void;
}

const HintsSection: React.FC<HintsSectionProps> = ({
  hints,
  add,
  remove,
  update,
}) => (
  <div className="flex flex-col gap-3">
    <label className="font-semibold">Hints (Optional)</label>
    {hints.map((hint, i) => (
      <div key={i} className="flex gap-2">
        <input
          value={hint}
          onChange={(e) => update(i, e.target.value)}
          placeholder={`Hint ${i + 1}`}
          className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none flex-1"
        />
        <Button
          type="button"
          onClick={() => remove(i)}
          variant="destructive"
          className="shrink-0"
        >
          Remove
        </Button>
      </div>
    ))}
    <Button
      type="button"
      onClick={add}
      variant="outline"
      className="w-fit text-black"
    >
      + Add Hint
    </Button>
  </div>
);

export default HintsSection;
