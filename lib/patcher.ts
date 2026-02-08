import { applyPatch, createTwoFilesPatch } from "diff";

export function applyUnifiedDiff(original: string, diffText: string) {
  const result = applyPatch(original, diffText);
  if (result === false) {
    throw new Error("Patch failed to apply");
  }
  return result;
}

export function createUnifiedDiff(filePath: string, before: string, after: string) {
  return createTwoFilesPatch(filePath, filePath, before, after, "before", "after");
}
