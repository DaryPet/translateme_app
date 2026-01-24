export function validateQuestionInput(
  value: string,
  maxLength: number = 250,
): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
