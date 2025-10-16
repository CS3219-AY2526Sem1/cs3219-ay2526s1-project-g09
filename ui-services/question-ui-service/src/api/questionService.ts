import type { QuestionPreview } from "@/types/QuestionPreview";

interface GetQuestionsParams {
  category?: string;
  difficulty?: string;
  minTime?: number;
  maxTime?: number;
  size?: number;
  page?: number;
}

interface GetQuestionsResponse {
  questions: QuestionPreview[];
  totalCount: number;
}

export async function getQuestions(
  params: GetQuestionsParams,
): Promise<GetQuestionsResponse> {
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const query = new URLSearchParams();

  if (params.category) query.append("category", params.category);
  if (params.difficulty) query.append("difficulty", params.difficulty);
  if (params.minTime !== undefined)
    query.append("minTime", params.minTime.toString());
  if (params.maxTime !== undefined)
    query.append("maxTime", params.maxTime.toString());
  if (params.size) query.append("size", params.size.toString());
  if (params.page) query.append("page", params.page.toString());

  const uriLink = `${apiUri}/questions?${query.toString()}`;

  const response = await fetch(uriLink, { method: "GET" });
  if (!response.ok) throw new Error("Failed to fetch questions");

  const data: { questions?: QuestionPreview[]; total?: number } =
    await response.json();

  return {
    questions: data.questions ?? [],
    totalCount: data.total ?? 0,
  };
}

export async function updateQuestion(
  id: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string }> {
  const adminToken = import.meta.env.VITE_QUESTION_SERVICE_ADMIN_TOKEN;
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const res = await fetch(`${apiUri}/questions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update question");
  return res.json();
}

export interface GetCategoriesResponse {
  categories: string[];
}

export async function getCategories(): Promise<GetCategoriesResponse> {
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const uriLink = `${apiUri}/questions/categories`;

  const response = await fetch(uriLink, { method: "GET" });
  if (!response.ok) throw new Error("Failed to fetch categories");

  const data: { categories?: string[] } = await response.json();

  return {
    categories: data.categories ?? [],
  };
}

export async function getDifficulties(): Promise<{ difficulties: string[] }> {
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const response = await fetch(`${apiUri}/questions/difficulties`);
  if (!response.ok) throw new Error("Failed to fetch difficulties");
  const data: { difficulties?: string[] } = await response.json();
  return { difficulties: data.difficulties ?? [] };
}

export interface QuestionDetails {
  questionId: string;
  title: string;
  categoryTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  content: string;
  hints: string[];
  exampleTestcases: string;
  codeSnippets: {
    lang: string;
    langSlug: string;
    code: string;
  }[];
  createdAt: string;
  updatedAt: string;
  answer?: string;
}

/**
 * Fetch question details by ID
 */
export async function getQuestionById(id: string): Promise<QuestionDetails> {
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const response = await fetch(`${apiUri}/questions/${id}`);

  if (response.status === 404) throw new Error("Question not found");
  if (!response.ok) throw new Error("Failed to fetch question details");

  const data: QuestionDetails = await response.json();
  return data;
}

export interface CreateQuestionPayload {
  title: string;
  categoryTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  content: string;
  hints: string[];
}

export interface CreateQuestionResponse {
  questionId: string;
  ok: boolean;
  id?: string;
  message: string;
}

/**
 * Create a new question
 */
export async function createQuestion(
  payload: CreateQuestionPayload,
): Promise<CreateQuestionResponse> {
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const adminToken = import.meta.env.VITE_QUESTION_SERVICE_ADMIN_TOKEN;
  const response = await fetch(`${apiUri}/add-question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify(payload),
  });

  const json: {
    ok?: boolean;
    message?: string;
    id?: string;
    questionId?: string;
    details?: { message: string }[];
    error?: string;
  } = await response.json();

  if (!response.ok) {
    const errorMsg = json.details
      ? `Validation errors: ${json.details.map((d) => d.message).join(", ")}`
      : json.error || "Failed to save question";
    throw new Error(errorMsg);
  }

  return {
    ok: json.ok ?? false,
    message: json.message ?? "Question created",
    id: json.id,
    questionId: json.questionId ?? "",
  };
}

export interface DeleteQuestionResponse {
  ok: boolean;
  message: string;
  deletedId: string;
  title: string;
}

/**
 * Delete a question by ID
 */
export async function deleteQuestion(
  id: string,
): Promise<DeleteQuestionResponse> {
  const apiUri = import.meta.env.VITE_QUESTION_SERVICE_API_LINK;
  const adminToken = import.meta.env.VITE_QUESTION_SERVICE_ADMIN_TOKEN;

  const response = await fetch(`${apiUri}/questions/${id}`, {
    method: "DELETE",
    headers: {
      "x-admin-token": adminToken,
    },
  });

  const json: {
    ok?: boolean;
    message?: string;
    deletedId?: string;
    title?: string;
    error?: string;
  } = await response.json();

  if (!response.ok) {
    const errorMsg = json.error || "Failed to delete question";
    throw new Error(errorMsg);
  }

  return {
    ok: json.ok ?? false,
    message: json.message ?? "Question deleted successfully",
    deletedId: json.deletedId ?? id,
    title: json.title ?? "",
  };
}
