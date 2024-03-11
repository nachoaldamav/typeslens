# typeslens - Visual Studio Code Extension

## Overview
typeslens is a Visual Studio Code extension designed to enhance your TypeScript development experience. It intelligently scans the imports in your code and alerts you whenever it detects a package that could benefit from TypeScript type definitions available on npm. If a corresponding @types package is available, typeslens suggests an inline notification, 'Install types for X (@types/X)', right in your imports.

## Features
- Automatic Parsing: Uses Babel to parse currently open files and extract all import statements.
- Local Search for Modules: Identifies installed modules based on the location of the file and checks for available TypeScript definitions.
- Package Manager Compatibility: Detects and adheres to the package manager used in your project (npm, yarn, pnpm, bun, and Bit), with npm as the default.
- Lockfile Analysis: Analyzes the lockfiles in your project's root directory to ensure compatibility with your package manager and project dependencies.

## Installation
1. Open Visual Studio Code.
2. Go to Extensions (Ctrl+Shift+X).
3. Search for typeslens.
4. Click on 'Install'.

## Usage
Once installed, typeslens works automatically. Open any TypeScript file, and the extension will:

1. Parse the file to identify all import statements.
2. Check for installed modules without TypeScript definitions.
3. Notify you in-line if an @types package is available for any of these modules.

## Contributing
Your contributions are welcome! Whether it's bug reports, feature suggestions, or code contributions, please feel free to reach out or submit a pull request on our GitHub repository.

## Support
If you encounter any issues or have questions, please file an issue on our GitHub issues page.

## License
This project is licensed under MIT License.