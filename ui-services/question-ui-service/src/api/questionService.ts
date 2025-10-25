import type { QuestionPreview } from "@/types/QuestionPreview";

const API_URI =
  (import.meta.env.VITE_MODE == "dev"
    ? "http://localhost:5275"
    : "http://peerprep-question-service.ap-southeast-1.elasticbeanstalk.com") +
  "/api/v1/question-service";
const ADMIN_TOKEN = "I-love-irish-ice-cream";

/** Generic type-safe fetch helper */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URI}${endpoint}`, options);

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (!res.ok) {
    const errMsg =
      (json as { error?: string; details?: { message: string }[] })?.error ||
      (json as { details?: { message: string }[] })?.details
        ?.map((d) => d.message)
        .join(", ") ||
      "API request failed";
    throw new Error(errMsg);
  }

  return json as T;
}

/** --- DTOs --- */
export interface GetQuestionsParams {
  title?: string;
  category?: string;
  difficulty?: string;
  minTime?: number;
  maxTime?: number;
  size?: number;
  page?: number;
}

export interface GetQuestionsResponse {
  questions: QuestionPreview[];
  totalCount: number;
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

export interface CreateQuestionPayload {
  title: string;
  categoryTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  content: string;
  hints: string[];
  answer?: string;
}

export interface UpdateQuestionPayload {
  title?: string;
  categoryTitle?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  timeLimit?: number;
  content?: string;
  hints?: string[];
  answer?: string;
}

export interface CreateQuestionResponse {
  questionId: string;
  ok: boolean;
  id?: string;
  message: string;
}

export interface DeleteQuestionResponse {
  ok: boolean;
  message: string;
  deletedId: string;
  title: string;
}

export interface GetCategoriesResponse {
  categories: string[];
}

export interface GetDifficultiesResponse {
  difficulties: string[];
}

/** --- API Functions --- */
export async function getQuestions(
  params: GetQuestionsParams,
): Promise<GetQuestionsResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });

  const raw = await apiFetch<{ questions?: QuestionPreview[]; total?: number }>(
    `/questions?${query.toString()}`,
  );

  return {
    questions: raw.questions ?? [],
    totalCount: raw.total ?? 0,
  };
}

export async function getQuestionById(id: string): Promise<QuestionDetails> {
  return apiFetch<QuestionDetails>(`/questions/${id}`);
}

export async function createQuestion(
  payload: CreateQuestionPayload,
): Promise<CreateQuestionResponse> {
  return apiFetch<CreateQuestionResponse>("/add-question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateQuestion(
  id: string,
  payload: UpdateQuestionPayload,
): Promise<{ ok: boolean; message?: string }> {
  return apiFetch<{ ok: boolean; message?: string }>(`/questions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteQuestion(
  id: string,
): Promise<DeleteQuestionResponse> {
  return apiFetch<DeleteQuestionResponse>(`/questions/${id}`, {
    method: "DELETE",
    headers: { "x-admin-token": ADMIN_TOKEN },
  });
}

export async function getCategories(): Promise<GetCategoriesResponse> {
  return apiFetch<GetCategoriesResponse>("/questions/categories");
}

export async function getDifficulties(): Promise<GetDifficultiesResponse> {
  return apiFetch<GetDifficultiesResponse>("/questions/difficulties");
}
