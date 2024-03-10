import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

export function findPackageJson(
  nodeModulesPath: string,
  packageName: string
): string | null {
  let packagePath = join(nodeModulesPath, packageName);

  if (!existsSync(packagePath)) {
    return null;
  }

  // Check if the packagePath is a symlink, if so, resolve it to the real path
  const packageStats = lstatSync(packagePath);
  if (packageStats.isSymbolicLink()) {
    packagePath = realpathSync(packagePath);
  }

  const packageJsonPath = join(packagePath, 'package.json');

  if (existsSync(packageJsonPath)) {
    return packageJsonPath;
  }

  return null;
}
