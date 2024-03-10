import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import { join } from 'node:path';
import fs from 'node:fs';
import { convertToDefinitelyTyped } from './utils/name-to-typed';
import { findPackageJson } from './utils/find-package';
import { getPackageJsonFromName } from './utils/package-from-name';
import { packageHasTypes } from './utils/package-has-types';
import { findNearestNodeModules } from './utils/find-near-nm';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "typeslens" is now active!');

  const jsFileLensProvider = vscode.languages.registerCodeLensProvider(
    { language: 'javascript', scheme: 'file' },
    new TypeSuggestionCodeLensProvider()
  );

  const tsFileLensProvider = vscode.languages.registerCodeLensProvider(
    { language: 'typescript', scheme: 'file' },
    new TypeSuggestionCodeLensProvider()
  );

  context.subscriptions.push(jsFileLensProvider);
  context.subscriptions.push(tsFileLensProvider);

  const installCommandDisposable = vscode.commands.registerCommand(
    'extension.installTypes',
    async (packageName) => {
      // First we need to get the package manager to use, we will use the lockfile to determine it, as default we will use npm
      const lockfiles = [
        {
          lockfileName: 'workspace.jsonc',
          packageManager: 'bit',
          installCommand: `bit install ${packageName}`,
        },
        {
          lockfileName: 'yarn.lock',
          packageManager: 'yarn',
          installCommand: `yarn add ${packageName} --dev`,
        },
        {
          lockfileName: 'package-lock.json',
          packageManager: 'npm',
          installCommand: `npm install ${packageName} --save-dev`,
        },
        {
          lockfileName: 'pnpm-lock.yaml',
          packageManager: 'pnpm',
          installCommand: `pnpm add ${packageName} --save-dev`,
        },
        {
          lockfileName: 'bun.lockb',
          packageManager: 'bun',
          installCommand: `bun add ${packageName} -D`,
        },
      ];

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace found');
        return;
      }

      const workspaceFolder = workspaceFolders[0];
      let lockfile: (typeof lockfiles)[number] | undefined = lockfiles.find(
        (lockfile) =>
          fs.existsSync(join(workspaceFolder.uri.fsPath, lockfile.lockfileName))
      );

      if (!lockfile) {
        vscode.window.showErrorMessage(
          `No lockfile found in ${workspaceFolder.uri.fsPath}`
        );
        lockfile = lockfiles.find(
          (lockfile) => lockfile.packageManager === 'npm'
        );
      }

      const installCommand = lockfile?.installCommand;

      vscode.window.showInformationMessage(
        `Installing ${packageName} with ${lockfile?.packageManager}`
      );

      const taskName = `Install ${packageName}`;
      const taskDefinition = { type: 'shell', task: taskName };
      const shellExecution = new vscode.ShellExecution(
        installCommand as string
      );
      const task = new vscode.Task(
        taskDefinition,
        taskName,
        lockfile?.packageManager as string,
        shellExecution
      );

      try {
        await vscode.tasks.executeTask(task);
        await new Promise<void>((resolve, reject) => {
          const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
            if (e.execution.task === task) {
              disposable.dispose();
              if (e.exitCode === 0) {
                resolve();
              } else {
                reject(new Error('Installation failed'));
              }
            }
          });
        });
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to install ${packageName}: ${error}`
        );
      } finally {
        // Save the file to trigger the code lenses again
        const document = vscode.window.activeTextEditor?.document;
        if (document) {
          await document.save();
        }
      }
    }
  );

  context.subscriptions.push(installCommandDisposable);
}

export function deactivate() {}

/**
 * A CodeLens provider that finds missing types in the current open file and
 * suggests to install them automatically.
 */
class TypeSuggestionCodeLensProvider implements vscode.CodeLensProvider {
  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    const codeText = document.getText();

    const parsedAST = parse(codeText, {
      sourceType: 'module',
    });

    if (!parsedAST) {
      return codeLenses;
    }

    // Get all import statements
    const imports = parsedAST.program.body.filter(
      (item) => item.type === 'ImportDeclaration'
    );

    for (const item of imports) {
      if (item.loc) {
        try {
          const range = new vscode.Range(
            item.loc.start.line - 1,
            item.loc.start.column,
            item.loc.end.line - 1,
            item.loc.end.column
          );

          // @ts-expect-error - The types of the parser are not correct
          const packageName = item.source.value;

          console.log(
            `Trying to find types for ${packageName} from ${document.uri.fsPath}`
          );

          // Check if the package has a type definition reading its package.json in the related node_modules to the file
          const packageJson = getPackageJsonFromName(packageName, document);

          if (packageHasTypes(packageJson)) {
            console.log(`Package ${packageName} has types`);
            continue;
          }

          const typesPackageName = convertToDefinitelyTyped(packageName);

          const typeExists = await fetch(
            `https://registry.npmjs.org/${typesPackageName}`
          )
            .then((res) => res.json())
            .catch(() => false);

          if (!typeExists) {
            console.log(`Package ${packageName} does not have types`);
            continue;
          }

          // Check if the types package is already installed
          const typesPackageJsonPath = findPackageJson(
            // @ts-expect-error
            findNearestNodeModules(document.uri.fsPath),
            typesPackageName
          );

          if (typesPackageJsonPath) {
            console.log(`Package ${typesPackageName} is already installed`);
            continue;
          }

          const codeLens = new vscode.CodeLens(range, {
            title: `Install types for ${packageName} (${typesPackageName})`,
            command: 'extension.installTypes',
            arguments: [typesPackageName],
            tooltip: `Install types for ${packageName} (${typesPackageName}@latest)`,
          });

          codeLenses.push(codeLens);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return codeLenses;
  }

  resolveCodeLens?(codeLens: vscode.CodeLens): vscode.CodeLens | null {
    // When clicked, the Types package will be installed, so we need to remove the clicked CodeLens
    if (codeLens.isResolved) {
      codeLens.range = new vscode.Range(0, 0, 0, 0);
    }
    return codeLens;
  }
}
