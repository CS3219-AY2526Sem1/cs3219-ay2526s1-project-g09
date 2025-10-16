import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

interface QuestionFiltersProps {
  categories: string[];
  difficulties: string[];
  selectedCategory: string;
  selectedDifficulty: string;
  timeRange: [number, number];
  onCategoryChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onTimeChange: (val: [number, number]) => void;
  resetPage: () => void;
}

const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  categories,
  difficulties,
  selectedCategory,
  selectedDifficulty,
  timeRange,
  onCategoryChange,
  onDifficultyChange,
  onTimeChange,
  resetPage,
}) => {
  return (
    <div className="flex flex-wrap gap-6 mb-6">
      {/* Category Dropdown */}
      <div>
        <p className="font-semibold mb-1">Category</p>
        <Select
          value={selectedCategory || undefined}
          onValueChange={(val) => {
            onCategoryChange(val ?? "");
            resetPage();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty Dropdown */}
      <div>
        <p className="font-semibold mb-1">Difficulty</p>
        <Select
          value={selectedDifficulty || undefined}
          onValueChange={(val) => {
            onDifficultyChange(val ?? "");
            resetPage();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map((diff) => (
              <SelectItem key={diff} value={diff}>
                {diff}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Limit Slider */}
      <div className="flex flex-col flex-1">
        <p className="font-semibold mb-2">Time Limit (minutes)</p>
        <DualRangeSlider
          min={1}
          max={240}
          value={timeRange}
          onValueChange={(val) => onTimeChange([val[0], val[1]])}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{timeRange[0]} min</span>
          <span>{timeRange[1]} min</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionFilters;
