// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getL10nCompleteProvider } from "./complete/l10n";

const l10npath = vscode.workspace
  .getConfiguration("l10n-autocomplete")
  .get("l10nPath");

if (!l10npath) {
  vscode.window.showErrorMessage(
    "l10n-autocomplete: l10nPath 설정이 필요합니다."
  );
}

const L10N_PATH = l10npath;
const LOCALE_PATH = "locales";
const L10N_FILES = [
  "blocks-msgs",
  "editor-msgs",
  "paint-editor-msgs",
  "interface-msgs",
  "extensions-msgs",
];

async function loadJsModule(path: string) {
  const fileUri = vscode.Uri.file(path);

  try {
    // 파일 읽기 (Uint8Array로 반환됨)
    const fileData = await vscode.workspace.fs.readFile(fileUri);
    const fileText = new TextDecoder("utf-8").decode(fileData);

    // `export default`를 `module.exports =`로 변환
    const transformedCode = fileText.replace(
      /export\s+default\s+/,
      "module.exports = "
    );

    // 실행할 가상 모듈 컨텍스트 생성
    const sandbox = { module: { exports: {} } };

    // 변환된 코드를 실행
    new Function("module", transformedCode)(sandbox.module);

    const moduleExports = sandbox.module.exports;
    console.log(moduleExports);
    return moduleExports;
  } catch (error) {
    console.error("파일을 가져올 수 없음:", error);
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
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

  const l10nFiles: any = L10N_FILES.map(async (fileName) => {
    const l10nData = await loadJsModule(
      `${L10N_PATH}/${LOCALE_PATH}/${fileName}.js`
    );
    return l10nData;
  });

  let l10n: any = {};

  await Promise.all(l10nFiles).then((l10nData) => {
    l10nData.forEach((l10nItem) => {
      if (!l10nItem) {
        return;
      }
      Object.keys(l10nItem).forEach((language) => {
        if (!l10nItem[language]) {
          return;
        }

        if (l10n[language]) {
          l10n[language] = { ...l10n[language], ...l10nItem[language] };
        } else {
          l10n[language] = l10nItem[language];
        }
      });
    });
    return l10n;
  });

  console.log("load", l10n);

  //자동완성기능
  // Plain text 파일(또는 원하는 언어)에 대해 CompletionItemProvider 등록
  // JavaScript 파일에 대해 CompletionItemProvider 등록
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
    "." // 트리거 문자: 점('.')
  );

  context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
