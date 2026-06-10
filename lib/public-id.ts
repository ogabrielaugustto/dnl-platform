export function formatPublicId(value: number | null | undefined) {
  return value ? `#${value}` : "#--------";
}
