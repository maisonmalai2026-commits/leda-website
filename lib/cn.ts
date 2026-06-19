// Tiny className combiner — joins truthy class strings with a space.
// Avoids pulling in an external dependency for this trivial helper.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
