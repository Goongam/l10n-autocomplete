// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getL10nCompleteProvider } from "./complete/l10n";
import { reloadL10n } from "./complete/loadL10n";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "l10n-autocomplete" is now active in the web extension host!'
  );

  let l10n: any = {};

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "l10n-autocomplete.reloadl10n",
    async () => {
      // The code you place here will be executed every time your command is executed
      l10n = await reloadL10n();
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "l10n-autocomplete: l10n 파일을 다시 로드했습니다."
      );
    }
  );

  context.subscriptions.push(disposable);

  console.log("load!!", l10n.ko);

  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file", language: "javascript" },
    {
      provideCompletionItems: (
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) => getL10nCompleteProvider(document, position, token, context, l10n),
    },
    "."
  );

  context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
