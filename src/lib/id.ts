export function createId() {
  return `c${crypto.randomUUID().replaceAll("-", "")}`;
}
