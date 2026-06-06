export function incrementLoadingCount(count: number): number {
  return count + 1;
}

export function decrementLoadingCount(count: number): number {
  return Math.max(0, count - 1);
}

export function isLoadingActive(count: number): boolean {
  return count > 0;
}
