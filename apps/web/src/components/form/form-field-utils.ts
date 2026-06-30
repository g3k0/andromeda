export function resolveFormFieldLabelId(htmlFor: string, labelId?: string): string {
  return labelId ?? `${htmlFor}-label`;
}

export function formFieldDescribedBy(
  error: string | undefined,
  errorId: string,
  hintId?: string,
): string | undefined {
  if (error) {
    return hintId ? `${errorId} ${hintId}` : errorId;
  }
  return hintId;
}
