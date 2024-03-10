import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Find the nearest node_modules folder relative to the given file path
 * @param filePath
 * @returns string | null
 */
export function findNearestNodeModules(filePath: string): string | null {
  let currentDir = dirname(filePath);
  while (currentDir !== '/') {
    const nodeModulesPath = join(currentDir, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      console.log('Found node_modules at', nodeModulesPath);
      return nodeModulesPath;
    }
    currentDir = dirname(currentDir);
  }
  return null;
}
