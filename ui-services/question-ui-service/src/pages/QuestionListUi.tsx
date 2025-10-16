import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import QuestionCard from "../components/QuestionCard";
import {
  getCategories,
  getDifficulties,
  getQuestions,
} from "@/api/questionService";
import type { QuestionPreview } from "@/types/QuestionPreview";
import FilterBar from "../components/QuestionList/FilterBar";
import PaginationBar from "../components/QuestionList/PaginationBar";

interface QuestionListWithFiltersProps {
  onNavigate: (path: string) => void;
}

const itemsPerPage = 8;

const QuestionListWithFilters: React.FC<QuestionListWithFiltersProps> = ({
  onNavigate,
}) => {
  const [questions, setQuestions] = useState<QuestionPreview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [timeRange, setTimeRange] = useState<[number, number]>([1, 240]);

  const totalPages = totalQuestions
    ? Math.ceil(totalQuestions / itemsPerPage)
    : 1;

  // Fetch categories and difficulties
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catData, diffData] = await Promise.all([
          getCategories(),
          getDifficulties(),
        ]);
        setCategories(catData.categories);
        setDifficulties(diffData.difficulties);
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch questions whenever filters or page change
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await getQuestions({
          category: selectedCategory,
          difficulty: selectedDifficulty,
          minTime: timeRange[0],
          maxTime: timeRange[1],
          size: itemsPerPage,
          page: currentPage,
        });
        setQuestions(data.questions);
        setTotalQuestions(data.totalCount);
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [currentPage, selectedCategory, selectedDifficulty, timeRange]);

  return (
    <div className="flex flex-col w-full p-6 rounded-lg">
      {/* Filter Section */}
      <FilterBar
        categories={categories}
        difficulties={difficulties}
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        timeRange={timeRange}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setSelectedDifficulty}
        onTimeChange={setTimeRange}
        resetPage={() => setCurrentPage(1)}
      />

      {/* Pagination */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalQuestions={totalQuestions}
        itemsPerPage={itemsPerPage}
        loading={loading}
        onNext={() => setCurrentPage(currentPage + 1)}
        onPrevious={() => setCurrentPage(currentPage - 1)}
      />

      {/* Column Headers */}
      <div className="p-2 flex items-center gap-4 font-bold border-b border-gray-300">
        <div className="w-15 grid justify-center">No.</div>
        <div className="px-10 flex-1 grid grid-cols-4 gap-4">
          <div>Question</div>
          <div>Category</div>
          <div>Difficulty</div>
          <div>Time Limit</div>
        </div>
      </div>

      {/* Question List */}
      <div className="flex flex-col items-center gap-4 overflow-y-auto min-h-[60vh]">
        {loading ? (
          <p className="text-gray-500 mt-10">Loading questions...</p>
        ) : questions.length > 0 ? (
          questions.map((item, index) => (
            <QuestionCard
              key={item.questionId}
              item={item}
              index={(currentPage - 1) * itemsPerPage + index + 1}
              onClick={() => onNavigate(`/questions/${item.questionId}`)}
            />
          ))
        ) : (
          <p className="text-gray-500 mt-10">No questions found.</p>
        )}
      </div>

      {/* Add Question Button */}
      <div className="flex justify-center mt-6">
        <Button onClick={() => onNavigate("/questions/add")}>
          + Add New Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionListWithFilters;
