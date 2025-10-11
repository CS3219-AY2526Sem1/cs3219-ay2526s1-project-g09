export interface SeedBatchResponse {
  ok: boolean;
  message: string;
  nextSkip: number;
  done: boolean;
  // keep room for extra fields
  [k: string]: unknown;
}
