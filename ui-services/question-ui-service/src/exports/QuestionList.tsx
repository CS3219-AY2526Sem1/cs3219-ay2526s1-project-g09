import React, { useState, useEffect, useCallback } from "react";
import QuestionCard from "../components/QuestionCard";
import {
  getCategories,
  getDifficulties,
  getQuestions,
} from "@/api/questionService";
import type { QuestionPreview } from "@/types/QuestionPreview";
import FilterBar from "../components/QuestionList/FilterBar";
import PaginationBar from "../components/QuestionList/PaginationBar";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

interface Filters {
  title: string;
  category: string;
  difficulty: string;
  timeRange: [number, number];
}

const QuestionListUi: React.FC = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionPreview[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    title: "",
    category: "",
    difficulty: "",
    timeRange: [1, 120],
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);

  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE) || 1;

  // Fetch categories and difficulties once
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
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getQuestions({
        title: filters.title,
        category: filters.category,
        difficulty: filters.difficulty,
        minTime: filters.timeRange[0],
        maxTime: filters.timeRange[1],
        size: ITEMS_PER_PAGE,
        page: currentPage,
      });
      setQuestions(data.questions);
      setTotalQuestions(data.totalCount);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Debounce title search
  useEffect(() => {
    const handler = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(handler);
  }, [filters.title]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col w-full p-6 rounded-lg">
      <FilterBar
        categories={categories}
        difficulties={difficulties}
        selectedCategory={filters.category}
        selectedDifficulty={filters.difficulty}
        timeRange={filters.timeRange}
        titleSearch={filters.title}
        onCategoryChange={(val) => updateFilter("category", val)}
        onDifficultyChange={(val) => updateFilter("difficulty", val)}
        onTimeChange={(val) => updateFilter("timeRange", val)}
        onTitleSearchChange={(val) => updateFilter("title", val)}
        resetPage={() => setCurrentPage(1)}
      />

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalQuestions={totalQuestions}
        itemsPerPage={ITEMS_PER_PAGE}
        loading={loading}
        onNext={() => setCurrentPage((p) => p + 1)}
        onPrevious={() => setCurrentPage((p) => p - 1)}
      />

      <div className="p-2 flex items-center gap-4 font-bold">
        <div className="w-15 grid justify-center">No.</div>
        <div className="px-10 flex-1 grid grid-cols-4 gap-4">
          <div>Question</div>
          <div>Category</div>
          <div>Difficulty</div>
          <div>Time Limit</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 overflow-y-auto min-h-[60vh]">
        {loading ? (
          <p className="text-gray-500 mt-10">Loading questions...</p>
        ) : questions.length > 0 ? (
          questions.map((item, index) => (
            <QuestionCard
              key={item.questionId}
              item={item}
              index={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
              onClick={() => navigate(`/questions/${item.questionId}`)}
            />
          ))
        ) : (
          <p className="text-gray-500 mt-10">No questions found.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionListUi;
