/**
 * Converts a package name to its DefinitelyTyped equivalent
 * @param packageName
 * @returns string
 * @example
 * convertToDefinitelyTyped('angular') -> `@types/angular`
 * convertToDefinitelyTyped('@angular/core') -> `@types/angular__core`
 */
export function convertToDefinitelyTyped(packageName: string): string {
  if (packageName.startsWith('@')) {
    // For scoped packages like @angular/core, it becomes @types/angular__core
    return `@types/${packageName.substring(1).replace(/\//g, '__')}`;
  }

  // For unscoped packages like xyz, it becomes @types/xyz
  return `@types/${packageName}`;
}
