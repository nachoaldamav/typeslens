import type * as vscode from 'vscode';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { findPackageJson } from './find-package';
import { findNearestNodeModules } from './find-near-nm';

export function getPackageJsonFromName(
  packageName: string,
  document: vscode.TextDocument
) {
  const currentFileDir = dirname(document.uri.fsPath);
  console.log('currentFileDir', currentFileDir);

  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [currentFileDir],
    });
    return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  } catch (e) {
    const nodeModulesPath = findNearestNodeModules(document.uri.fsPath);
    if (!nodeModulesPath) {
      throw new Error('No node_modules folder found');
    }

    console.log(`Found node_modules at ${nodeModulesPath}`);

    const packageJsonPath = findPackageJson(nodeModulesPath, packageName);

    if (!packageJsonPath) {
      throw new Error(`Package ${packageName} not found in ${nodeModulesPath}`);
    }

    return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  }
}
