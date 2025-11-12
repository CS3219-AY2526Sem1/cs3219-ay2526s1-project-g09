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
  return (
    <div className="flex justify-end items-center mb-4 text-gray-400 text-sm gap-2">
      <span>
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalQuestions)} of{" "}
        {totalQuestions}
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
