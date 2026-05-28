/**
 * Compares jewellery sizes stored as "major.minor" strings.
 * e.g. "2.2" < "2.8" < "2.10" < "2.12"
 *
 * Normal string/float sort fails because "2.10" < "2.2" as a string,
 * and parseFloat("2.10") === 2.1 < 2.2. We split into [major, minor] parts.
 */
export function compareSize(a: string, b: string): number {
  const parse = (s: string): [number, number] => {
    const [maj, min] = s.split(".");
    return [parseInt(maj ?? "0", 10), parseInt(min ?? "0", 10)];
  };
  const [aMaj, aMin] = parse(a);
  const [bMaj, bMin] = parse(b);
  return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
}

/** Sort an array of size strings in-place, small → large. */
export function sortSizes<T extends { size: string }>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => compareSize(a.size, b.size));
}
