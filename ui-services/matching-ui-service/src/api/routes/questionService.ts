import type { GetCategoriesWithDifficultiesResponse } from "../dto/question.dto";
import { apiFetch, QUESTION_API_BASE } from "../helpers/apiHelpers";

export async function getCategoriesWithDifficulties(): Promise<GetCategoriesWithDifficultiesResponse> {
  return apiFetch<GetCategoriesWithDifficultiesResponse>(
    QUESTION_API_BASE,
    "/questions/categories-with-difficulties",
  );
}
