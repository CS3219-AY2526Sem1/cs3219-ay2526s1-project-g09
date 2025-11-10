import React, { useEffect, useState } from "react";
import type { Question } from "@/types/Question";
import { getQuestionById } from "@/api/questionService";
import HintDialog from "../components/HintDialog";
import AnswerButton from "./AnswerButton";

interface QuestionDisplayProps {
  questionId: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questionId }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getQuestionById(questionId);
        setQuestion({
          id: data.questionId,
          title: data.title,
          body: data.content,
          topics: [data.categoryTitle ?? "Uncategorized"],
          hints: data.hints ?? [],
          answer: data.answer ?? "",
          difficulty: data.difficulty,
          timeLimit: data.timeLimit,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load question");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [questionId]);

  if (loading) return <p className="text-gray-400">Loading question...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!question) return <p className="text-gray-400">No question found</p>;

  return (
    <div className="flex-grow-0 mb-4 bg-gray-800 p-4 rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl font-semibold mb-2 text-white break-words">
        {question.title}
      </h2>
      <div className="flex flex-wrap gap-2 mb-2">
        {question.hints.map((hint, index) => (
          <HintDialog key={index} hint={hint} index={index} />
        ))}

        {question.answer && question.answer.trim() !== "" && (
          <AnswerButton answer={question.answer} />
        )}
      </div>
      <div
        className="prose prose-invert max-w-none text-white break-words [&_*]:max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:whitespace-pre-wrap [&_code]:break-all [&_table]:block [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
        dangerouslySetInnerHTML={{ __html: question.body }}
      />
    </div>
  );
};

export default QuestionDisplay;
