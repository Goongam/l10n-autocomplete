// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

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
      provideCompletionItems(document, position, token, completionContext) {
        // 현재 줄에서 커서 위치까지의 텍스트를 가져옵니다.
        const line = document.lineAt(position);
        const linePrefix = line.text.substring(0, position.character);

        // "a." 로 끝나지 않으면 자동완성 제안을 하지 않습니다.
        if (!linePrefix.endsWith("a.")) {
          return undefined;
        }

        // "a." 부분을 자동완성 항목으로 교체하기 위해 텍스트 범위 지정
        const startPosition = position.translate(0, -2); // "a."의 길이만큼 뒤로 이동
        const replaceRange = new vscode.Range(startPosition, position);

        // "a.a"와 "a.b" 자동완성 아이템 생성 및 교체 범위 지정
        const item1 = new vscode.CompletionItem(
          "a.a",
          vscode.CompletionItemKind.Text
        );
        item1.range = replaceRange;
        item1.detail = "a.a에 대한 간단한 설명";
        item1.documentation = new vscode.MarkdownString(
          "**a.a**는 예제 자동완성 항목입니다."
        );
        item1.kind = vscode.CompletionItemKind.Value;

        const item2 = new vscode.CompletionItem(
          "a.b",
          vscode.CompletionItemKind.Text
        );
        item2.range = replaceRange;

        return [item1, item2];
      },
    },
    "." // 트리거 문자: 점('.')
  );

  context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
