import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  itemsPerPage: number;
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalQuestions,
  itemsPerPage,
  loading,
  onNext,
  onPrevious,
}) => {
  const hasQuestions = totalQuestions > 0;
  const rangeStart = hasQuestions ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const rangeEnd = hasQuestions
    ? Math.min(currentPage * itemsPerPage, totalQuestions)
    : 0;

  return (
    <div className="flex justify-end items-center mb-4 text-gray-400 text-sm gap-2">
      <span>
        Showing {rangeStart} to {rangeEnd} of {totalQuestions}
      </span>
      <Button
        onClick={onPrevious}
        className="text-white"
        disabled={currentPage === 1 || loading}
        variant="link"
      >
        Previous
      </Button>
      <Button
        onClick={onNext}
        className="text-white"
        disabled={currentPage === totalPages || loading}
        variant="link"
      >
        Next
      </Button>
    </div>
  );
};

export default PaginationBar;
