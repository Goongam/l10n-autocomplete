import * as vscode from "vscode";
// @ts-ignore
import l10nPaintData from "./l10nPaintData.js";

// 해야할 것.
// 1. "a." -> "a.a"
// 2. "a.a." -> "a.a.a"

// 구현해야할 것
// 1. json 파일에서 모든 key를 가져와서 .을 기준으로 객체로 변경하기
// 2. 만약 "a." 을 입력했다면 객체의 a key에 대한 value를 가져와서 value 안에 있는 key들을 가져와서 자동완성 항목으로 제안하기
// 3. 만약 "a.a."를 입력했다면 객체의 a.a key에 대한 value를 가져와서 value 안에 있는 key들을 가져와서 자동완성 항목으로 제안하기
// 4. 만약 자동완성된 항목이 json 파일의 key값과 동일하다면 l10n의 key에 해당하는 value를 가져와서 마크다운 설명으로 보여주기.

// 예외 처리
// 1. 만약 "a."를 입력했는데 a key가 없다면 자동완성 항목으로 제안하지 않기
// 2. 만약 "a.a."를 입력했는데 a key가 없다면 자동완성 항목으로 제안하지 않기
// 3. 만약 "a.a."를 입력했는데 a key는 있지만 a.a key가 없다면 자동완성 항목으로 제안하지 않기
// 4. 만약 "a.a."를 입력했는데 a key는 있지만 a.a key는 있지만 a.a key의 value가 객체가 아니라면 자동완성 항목으로 제안하지 않기
// 5. 만약 "a.a."를 입력했는데 a key는 있지만 a.a key는 있지만 a.a key의 value가 객체이지만 그 객체가 비어있다면 자동완성 항목으로 제안하지 않기

const originL10n = { ...l10nPaintData };

const languageWhiteList = ["ko"];

type L10nId = string;
type Language = string;
type TranslatedValue = string;

interface L10nTranlatedValue {
  [key: L10nId]: {
    [key: Language]: TranslatedValue;
  };
}

function getL10nValue(): L10nTranlatedValue {
  let l10nTranlatedValue: L10nTranlatedValue = {};

  for (const language in originL10n) {
    const tranlateObjectInLauguage = originL10n[language];

    for (const l10nId in tranlateObjectInLauguage) {
      const translatedValue = tranlateObjectInLauguage[l10nId];

      if (l10nTranlatedValue[l10nId] === undefined) {
        l10nTranlatedValue[l10nId] = {};
      }

      l10nTranlatedValue[l10nId][language] = translatedValue;
    }
  }
  return l10nTranlatedValue;
}

function getL10nIdList(): string[] {
  return Object.keys(getL10nValue());
}

interface L10nIdObject {
  [key: string]: L10nIdObject | {};
}

function insertL10nIdObject(
  l10nIdObject: L10nIdObject,
  l10nId: string
): L10nIdObject {
  const l10nIdSplit = l10nId.split(".");
  const firstL10nId = l10nIdSplit[0];

  if (l10nIdObject[firstL10nId] === undefined) {
    l10nIdObject[firstL10nId] = {};
  }

  if (l10nIdSplit.length === 1) {
    return l10nIdObject;
  }

  const nextL10nId = l10nIdSplit.slice(1).join(".");

  const a = insertL10nIdObject(l10nIdObject[firstL10nId], nextL10nId);
  return {
    ...l10nIdObject,
    [firstL10nId]: a,
  };
}

function getL10nIdObject(): L10nIdObject {
  //   ["a.a.a", "a.a.b"] -> { "a: { "a": { "a": {}, "b": {} } } }
  const idList = getL10nIdList();
  let keyObject: L10nIdObject = {};

  for (const id of idList) {
    keyObject = insertL10nIdObject(keyObject, id);
  }

  return keyObject;
}

function removeQuotes(str: string) {
  if (str.startsWith('"')) {
    str = str.slice(1);
  }
  if (str.endsWith('"')) {
    str = str.slice(0, -1);
  }
  return str;
}

export function getL10nCompleteProvider(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext
): vscode.ProviderResult<any> {
  const l10nIdObject = getL10nIdObject();

  const line = document.lineAt(position);
  const linePrefix = line.text.substring(0, position.character);

  let currentText = linePrefix.split(" ").pop();
  if (!currentText) {
    return undefined;
  }

  currentText = removeQuotes(currentText);

  let splitids = currentText.split(".");

  if (splitids === undefined) {
    return undefined;
  }

  let foundL10nValue: L10nIdObject = { ...l10nIdObject };
  let completeKeyList: string[] = [];

  for (const id of splitids) {
    if (id === "") {
      continue;
    }

    if (!foundL10nValue[id]) {
      continue;
    }

    // if (Object.values(foundL10nValue[id]).length === 0) {
    //     completeItemsList = [];
    //     break;
    // }

    foundL10nValue = foundL10nValue[id];
    completeKeyList = Object.keys(foundL10nValue);
  }

  console.log(3, completeKeyList);

  const completeItemList = completeKeyList.map((id) => {
    const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Text);
    item.detail = "l10n";
    item.documentation = new vscode.MarkdownString(
      `**${id}**는 l10n의 key입니다.`
    );
    item.kind = vscode.CompletionItemKind.Value;
    return item;
  });

  return completeItemList;

  // 예제
  // 현재 줄에서 커서 위치까지의 텍스트를 가져옵니다.
  //   const line = document.lineAt(position);
  //   const linePrefix = line.text.substring(0, position.character);

  //   // "a." 로 끝나지 않으면 자동완성 제안을 하지 않습니다.
  //   if (!linePrefix.endsWith("a.")) {
  //     return undefined;
  //   }

  //   // "a." 부분을 자동완성 항목으로 교체하기 위해 텍스트 범위 지정
  //   const startPosition = position.translate(0, -2); // "a."의 길이만큼 뒤로 이동
  //   const replaceRange = new vscode.Range(startPosition, position);

  //   // "a.a"와 "a.b" 자동완성 아이템 생성 및 교체 범위 지정
  //   const item1 = new vscode.CompletionItem(
  //     "a.a",
  //     vscode.CompletionItemKind.Text
  //   );
  //   item1.range = replaceRange;
  //   item1.detail = "a.a에 대한 간단한 설명";
  //   item1.documentation = new vscode.MarkdownString(
  //     "**a.a**는 예제 자동완성 항목입니다."
  //   );
  //   item1.kind = vscode.CompletionItemKind.Value;

  //   const item2 = new vscode.CompletionItem(
  //     "a.b",
  //     vscode.CompletionItemKind.Text
  //   );
  //   item2.range = replaceRange;

  //   return [item1, item2];
}
