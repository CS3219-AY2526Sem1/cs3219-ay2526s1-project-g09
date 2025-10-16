import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  questionSchema,
  type QuestionForm,
  type QuestionFormValues,
} from "@/types/QuestionSchemas";

interface QuestionFormUiProps {
  initialValues?: QuestionFormValues;
  mode: "add" | "edit";
  onSubmit: (data: QuestionForm, hints: string[]) => Promise<void>;
  onBack: () => void;
}

const QuestionFormUi: React.FC<QuestionFormUiProps> = ({
  initialValues,
  mode,
  onSubmit,
  onBack,
}) => {
  const [hints, setHints] = useState<string[]>(initialValues?.hints ?? [""]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      categoryTitle: initialValues?.categoryTitle ?? "",
      difficulty: initialValues?.difficulty ?? "Easy",
      timeLimit: initialValues?.timeLimit ?? 60,
      content: initialValues?.content ?? "",
    },
  });

  const addHint = () => setHints([...hints, ""]);
  const removeHint = (index: number) =>
    setHints(hints.filter((_, i) => i !== index));
  const updateHint = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const handleFormSubmit: SubmitHandler<QuestionForm> = async (data) => {
    const cleanedHints = hints.map((h) => h.trim()).filter(Boolean);
    await onSubmit(data, cleanedHints);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-6 bg-gray-800 rounded-lg p-6 text-gray-200"
      >
        <h2 className="text-2xl font-bold">
          {mode === "add" ? "Add New Question" : "Edit Question"}
        </h2>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Title *</label>
          <input
            {...register("title")}
            placeholder="e.g., Two Sum"
            className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          {errors.title && (
            <span className="text-red-400 text-sm">{errors.title.message}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Category *</label>
            <input
              {...register("categoryTitle")}
              placeholder="e.g., Array"
              className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            {errors.categoryTitle && (
              <span className="text-red-400 text-sm">
                {errors.categoryTitle.message}
              </span>
            )}
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Difficulty *</label>
            <select
              {...register("difficulty")}
              className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            {errors.difficulty && (
              <span className="text-red-400 text-sm">
                {errors.difficulty.message}
              </span>
            )}
          </div>

          {/* Time Limit */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Time Limit (minutes) *</label>
            <input
              type="number"
              {...register("timeLimit", { valueAsNumber: true })}
              min={1}
              max={240}
              className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            {errors.timeLimit && (
              <span className="text-red-400 text-sm">
                {errors.timeLimit.message}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Content (HTML allowed) *</label>
          <textarea
            {...register("content")}
            rows={8}
            placeholder="Enter the question description..."
            className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
          />
          {errors.content && (
            <span className="text-red-400 text-sm">
              {errors.content.message}
            </span>
          )}
        </div>

        {/* Hints */}
        <div className="flex flex-col gap-3">
          <label className="font-semibold">Hints (Optional)</label>
          {hints.map((hint, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={hint}
                onChange={(e) => updateHint(index, e.target.value)}
                placeholder={`Hint ${index + 1}`}
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none flex-1"
              />
              <Button
                type="button"
                onClick={() => removeHint(index)}
                variant="destructive"
                className="shrink-0"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={addHint}
            variant="outline"
            className="w-fit text-black"
          >
            + Add Hint
          </Button>
        </div>

        {/* Submit + Reset + Back */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
          >
            {isSubmitting
              ? mode === "add"
                ? "Creating..."
                : "Saving..."
              : mode === "add"
                ? "Create Question"
                : "Save Changes"}
          </Button>
          <Button
            type="button"
            onClick={() => reset()}
            variant="outline"
            className="text-black"
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="ml-auto w-32 bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            Back
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuestionFormUi;
