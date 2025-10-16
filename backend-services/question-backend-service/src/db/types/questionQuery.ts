export interface QuestionQuery {
  categoryTitle?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  timeLimit?: {
    $gte?: number;
    $lte?: number;
  };
}
