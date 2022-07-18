function myFunction() {
  // 最初の行を取得したい
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("htmlからデータ追加");
  console.log(sheet.getDataRange().getValues());
  const firstRow = sheet.getRange("A1:1");
  const firstRowValue = firstRow.getValues()[0].filter(e=>e !== "");
  console.log(firstRowValue);
}


function onOpen(e){
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("htmlserviceいろいろ");
  menu.addItem("ScriptLetの基本(HtmlTemplate)", "scriptLet_");
  menu.addItem("gs側だけでhtmlを生成", "htmlOutput_");
  menu.addItem("html側のアクションを受け取る(google.script.runほか)", "scriptRun_");
  menu.addToUi();
}

function scriptLet_(){
  // テンプレートを使う
  const tmp = HtmlService.createTemplateFromFile("scriptletExample");
  // テンプレート内の変数にアクセスして代入できる
  const sheet = SpreadsheetApp.getActiveSheet().getName();
  tmp.curSheet = sheet;
  const htmlOutputObj = tmp.evaluate().setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutputObj, "script letとtemplateのサンプルだよ");
}

function htmlOutput_(){
  
}


function scriptRun_(){
  // 存在するファイルをそのまま使う
  const html = HtmlService.createHtmlOutputFromFile("googlescriptrunExample").setWidth(700).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, "これはただのタイトル？");
}

function setSubject(weekday, period, subject, url){
  const expectedColLength = 4;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("htmlからデータ追加");
  if(sheet === null){
    console.error("シートが見つからないよ〜");
    return Error("シートが見つからないよ〜");
  }
  const range = sheet.getDataRange();
  if(range.getWidth() !== expectedColLength){
    console.error(`シートの幅が違うよ〜`);
    return Error("シートの幅が違うよ〜");
  }
  const headerRange = sheet.getRange("A1:1");
  const headerValues = headerRange.getValues()[0].filter(e=>e !== "");
  // ヘッダー（先頭行）のカラムの存在確認と入れる場所のインデックス確保
  const weekdayLabel = "weekday";
  const periodLabel = "period";
  const subjectLabel = "subject";
  const urlLabel = "url";
  const indexByLabel = new Map();
  for(const headerLabel of [weekdayLabel, periodLabel, subjectLabel, urlLabel]){
    if(headerValues.indexOf(headerLabel) === -1){
      console.error(`ヘッダー ${headerLabel} が見つからないよ〜`);
      return Error(`ヘッダー ${headerLabel} が見つからないよ〜`);
    }
    indexByLabel.set(headerLabel, headerValues.indexOf(headerLabel));
  }
  const data = [weekday, period, subject, url].reduce((pre, cur, idx, arr)=>{
    if(idx===arr.length-1)return pre;
    arr[indexByLabel.get(cur)] = cur;
    return arr;
  }, new Array(expectedColLength));
  sheet.appendRow(data);
}

