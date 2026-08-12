export function newId(prefix: string): string {
  const uniq = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return `${prefix}_${uniq}`;
}
