export interface SeedBatchResponse {
  ok: boolean;
  message: string;
  nextSkip: number;
  // keep room for extra fields
  [k: string]: unknown;
}
