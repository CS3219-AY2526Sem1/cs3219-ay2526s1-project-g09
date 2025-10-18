import React, { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { questionFormSchema, type QuestionForm } from "./QuestionSchemas";
import FormField from "./FormField";
import HintsSection from "./HintsSection";
import { useHints } from "./useHints";
import type z from "zod";
import ContentEditor from "./ContentEditor";

interface QuestionFormUiProps {
  initialValues?: QuestionForm;
  mode: "add" | "edit";
  onSubmit: (data: QuestionForm) => Promise<void>;
  onBack: () => void;
}

const QuestionFormUi: React.FC<QuestionFormUiProps> = ({
  initialValues,
  mode,
  onSubmit,
  onBack,
}) => {
  const { hints, add, remove, update, cleaned } = useHints(
    initialValues?.hints,
  );

  type RawForm = z.input<typeof questionFormSchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RawForm, undefined, QuestionForm>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      categoryTitle: initialValues?.categoryTitle ?? "",
      difficulty: initialValues?.difficulty ?? "Easy",
      timeLimit: initialValues?.timeLimit ?? 60,
      content: initialValues?.content ?? "",
      answer: initialValues?.answer ?? "",
      hints: initialValues?.hints ?? [],
    },
  });

  const watchedContent = watch("content"); // watch content field

  const handleFormSubmit: SubmitHandler<QuestionForm> = async (data) => {
    await onSubmit({ ...data, hints: cleaned });
  };

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        {mode === "add" ? "Add New Question" : "Edit Question"}
      </h2>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex gap-6 h-[80vh]"
      >
        {/* Left Column: Editor + Meta info */}
        <div className="flex-[2] flex flex-col gap-6 overflow-y-auto">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-200 flex flex-col gap-4">
            <FormField label="Title *" error={errors.title?.message}>
              <input
                {...register("title")}
                placeholder="e.g., Two Sum"
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <div className="flex gap-4 flex-wrap">
              <FormField
                label="Category *"
                error={errors.categoryTitle?.message}
                className="flex-1 min-w-[150px]"
              >
                <input
                  {...register("categoryTitle")}
                  placeholder="e.g., Array"
                  className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                />
              </FormField>

              <FormField
                label="Difficulty *"
                error={errors.difficulty?.message}
                className="flex-1 min-w-[120px]"
              >
                <select
                  {...register("difficulty")}
                  className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </FormField>

              <FormField
                label="Time Limit (minutes) *"
                error={errors.timeLimit?.message}
                className="flex-1 min-w-[120px]"
              >
                <input
                  type="number"
                  {...register("timeLimit", { valueAsNumber: true })}
                  min={1}
                  max={240}
                  className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                />
              </FormField>
            </div>

            <div className="mb-8">
              <ContentEditor
                value={watchedContent}
                onChange={(val) => setValue("content", val)}
                error={errors.content?.message}
              />
            </div>

            <HintsSection
              hints={hints}
              add={add}
              remove={remove}
              update={update}
            />

            <FormField label="Answer" error={errors.answer?.message}>
              <textarea
                {...register("answer")}
                placeholder="Enter the correct answer..."
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none w-full h-32 resize-y"
              />
            </FormField>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white w-full"
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
                onClick={() => reset(initialValues)}
                variant="outline"
                className="flex-1 w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                disabled={isSubmitting}
              >
                Reset
              </Button>

              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="flex-[1] p-4 bg-gray-800 rounded-lg border border-gray-700 text-white overflow-y-auto">
          <h3 className="text-lg font-bold mb-2">Live Preview</h3>
          <div
            className="prose max-w-full overflow-x-auto font-mono text-sm"
            dangerouslySetInnerHTML={{ __html: watchedContent }}
          />
        </div>
      </form>
    </div>
  );
};

export default QuestionFormUi;
