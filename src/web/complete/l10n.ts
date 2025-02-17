import * as vscode from "vscode";
// @ts-ignore
import l10nPaintData from "./l10nPaintData.js";

const originL10n = { ...l10nPaintData };

const languageWhiteList = ["ko", "en", "ja", "zh"];

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

interface TranslatedValues {
  language: string;
  value: string;
} 
function getTranlations(languageWhiteList: string[], fullId: string): TranslatedValues[] {
  return languageWhiteList.map((language) => {
    return {
      language,
      value: originL10n?.[language]?.[fullId],
    };
  }).filter(({language, value}) => value !== undefined);
}

const LINEBREAK_INTER_LANGUAGE = 
`

`;
function createTranslateMarkdownString(translatedValues: TranslatedValues[]) {
  return translatedValues.map((value) => {
    return `**${value.language}**: ${value.value}`;
  }).join(LINEBREAK_INTER_LANGUAGE);
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

  const completeItemList = completeKeyList.map((id) => {
    const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Text);
    item.detail = "l10n";
    item.kind = vscode.CompletionItemKind.Value;
    
    // TODO: currentText + id으로 한 경우에는 다음 상황에서 번역 결과가 제공되지 않음
    // ex) gui.comingSoon.me 까지 입력 후 컨트롤 space를 누르면 번역 결과가 제공되지 않음
    const foundTranslations = getTranlations(languageWhiteList, currentText + id);

    if (foundTranslations.length > 0) {
      const translateMarkdownString = createTranslateMarkdownString(foundTranslations);
      const documentationString = `### ${currentText + id}${LINEBREAK_INTER_LANGUAGE}${translateMarkdownString}`;

      item.documentation = new vscode.MarkdownString(documentationString);
    }
    return item;
  });

  return completeItemList;
}
