import * as vscode from "vscode";

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
    // console.log(moduleExports);
    return moduleExports;
  } catch (error) {
    console.error("파일을 가져올 수 없음:", error);
  }
}

export async function reloadL10n(): Promise<any> {
  // L10N_FILES 배열은 여러 파일명을 포함합니다.
  const l10nFiles: Promise<any>[] = L10N_FILES.map(async (fileName) => {
    const l10nData = await loadJsModule(
      `${L10N_PATH}/${LOCALE_PATH}/${fileName}.js`
    );
    return l10nData;
  });

  let newL10n: any = {};

  await Promise.all(l10nFiles).then((l10nData) => {
    l10nData.forEach((l10nItem) => {
      if (!l10nItem) {
        return;
      }
      Object.keys(l10nItem).forEach((language) => {
        if (!l10nItem[language]) {
          return;
        }
        if (newL10n[language]) {
          newL10n[language] = { ...newL10n[language], ...l10nItem[language] };
        } else {
          newL10n[language] = l10nItem[language];
        }
      });
    });
  });

  console.log("reloadL10n: ", newL10n.ko);
  return newL10n;
}
