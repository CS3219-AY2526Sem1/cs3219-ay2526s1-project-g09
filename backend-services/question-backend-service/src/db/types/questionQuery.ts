export interface QuestionQuery {
  title?: {
    $regex: string;
    $options?: string;
  };
  categoryTitle?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  timeLimit?: {
    $gte?: number;
    $lte?: number;
  };
}
