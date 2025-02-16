import * as vscode from "vscode";

export function getL10nCompleteProvider(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
): vscode.ProviderResult<any> {
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
}
