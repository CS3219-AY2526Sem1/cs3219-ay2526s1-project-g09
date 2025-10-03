import React from "react";
import type { Question } from "@/types/Question";
import HintDialog from "./HintDialog";
import AnswerButton from "./AnswerButton";
import { mockQuestions } from "@/data/mock-data";
interface QuestionDisplayProps {
  question: Question;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question = mockQuestions[0],
}) => {
  return (
    <div className="flex-grow-0 mb-4 bg-gray-800 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">{question.title}</h2>
      <div className="flex space-x-2">
        {question.hints.map((hint, index) => (
          <HintDialog key={index} hint={hint} index={index} />
        ))}{" "}
        <AnswerButton />
      </div>

      <div className="">
        <p className="whitespace-pre-wrap">{question.body}</p>
      </div>
    </div>
  );
};

export default QuestionDisplay;
