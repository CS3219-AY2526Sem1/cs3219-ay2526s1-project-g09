import Bottleneck from "bottleneck";

export const dbLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 10,
});

export function withDbLimit<T>(fn: () => Promise<T>) {
  return dbLimiter.schedule(fn);
}
