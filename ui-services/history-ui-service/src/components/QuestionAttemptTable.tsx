import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import AttemptCard from "./AttemptCard";
import { mockAttempts } from "@/data/mock-history-data"; 

const itemsPerPage = 8;

const HistoryTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(mockAttempts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = mockAttempts.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex justify-center flex-col w-full p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-end items-center mb-4 text-gray-400 text-sm">
        <span>
          Showing {startIndex + 1} to{" "}
          {Math.min(endIndex, mockAttempts.length)} of {mockAttempts.length}
        </span>
        <Button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          variant="link"
          className="text-gray-400 px-2 hover:no-underline"
        >
          Previous
        </Button>
        <Button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          variant="link"
          className="text-gray-400 px-2 hover:no-underline"
        >
          Next
        </Button>
      </div>
      <div className="p-2 flex items-center gap-4 font-bold">
        <div className="px-10 flex-1 grid grid-cols-4 flex gap-4 ">
          <div className="flex flex-col">Date</div>

          <div className="flex flex-col">Time</div>
          <div className="flex flex-col">Partner</div>
          <div className="flex flex-col">Time Taken</div>
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-col items-center gap-4 overflow-y-auto min-h-[70vh]">
        {currentItems.map((item, index) => (
          <AttemptCard key={index} index={index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default HistoryTable;
