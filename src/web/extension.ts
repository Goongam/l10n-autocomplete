// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getL10nCompleteProvider } from "./complete/l10n";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "l10n-autocomplete" is now active in the web extension host!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "l10n-autocomplete.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from l10n-autocomplete in a web extension host!"
      );
    }
  );

  context.subscriptions.push(disposable);

  //자동완성기능
  // Plain text 파일(또는 원하는 언어)에 대해 CompletionItemProvider 등록
  // JavaScript 파일에 대해 CompletionItemProvider 등록
  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file", language: "javascript" },
    {
      provideCompletionItems: getL10nCompleteProvider,
    },
    "." // 트리거 문자: 점('.')
  );

  context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
