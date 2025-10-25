import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface QuestionFiltersProps {
  categories: string[];
  difficulties: string[];
  selectedCategory: string;
  selectedDifficulty: string;
  timeRange: [number, number];
  titleSearch: string;
  onCategoryChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onTimeChange: (val: [number, number]) => void;
  onTitleSearchChange: (val: string) => void;
  resetPage: () => void;
}

const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  categories,
  difficulties,
  selectedCategory,
  selectedDifficulty,
  timeRange,
  titleSearch,
  onCategoryChange,
  onDifficultyChange,
  onTimeChange,
  onTitleSearchChange,
  resetPage,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-6 mb-6">
      {/* Title Search */}
      <div className="flex flex-col flex-1 min-w-[200px]">
        <p className="font-semibold mb-1">Search Title</p>
        <input
          type="text"
          value={titleSearch}
          onChange={(e) => {
            onTitleSearchChange(e.target.value);
            resetPage();
          }}
          placeholder="Enter question title..."
          className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
        />
      </div>

      {/* Category Dropdown */}
      <div>
        <p className="font-semibold mb-1">Category</p>
        <Select
          value={selectedCategory || undefined}
          onValueChange={(val) => {
            onCategoryChange(val === "ALL" ? "" : val); // map sentinel to empty string
            resetPage();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
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
            onDifficultyChange(val === "ALL" ? "" : val); // map sentinel to empty string
            resetPage();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Difficulties</SelectItem>
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
          max={120}
          value={timeRange}
          onValueChange={(val) => onTimeChange([val[0], val[1]])}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{timeRange[0]} min</span>
          <span>{timeRange[1]} min</span>
        </div>
      </div>

      {/* Add Question Button */}
      <div className="flex justify-center mt-6">
        <Button
          className="bg-orange-500"
          onClick={() => navigate("/questions/add")}
        >
          + Add New Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionFilters;
