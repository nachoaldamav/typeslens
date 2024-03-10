/**
 * Check if a package has types by checking for:
 * - types field
 * - typings field
 * - .d.ts files in the files field
 * @param packageJson - The package.json object
 * @returns boolean
 */
export function packageHasTypes(packageJson: any) {
  if (packageJson.types) {
    return true;
  }

  if (packageJson.typings) {
    return true;
  }

  // Check if the package has exported a .d.ts file
  if (packageJson.files) {
    for (const file of packageJson.files) {
      if (file.endsWith('.d.ts')) {
        return true;
      }
    }
  }

  return false;
}
