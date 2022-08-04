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
  menu.addItem("Menuだとscriptletが無効になるっぽい", "invokeScriptletOnMenu_");
  menu.addItem("MenuでVueを使ってDrive上の画像をIDからbase64で表示できるのか？", "invokeScriptletOnMenu2_");
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
  SpreadsheetApp.getUi().showModalDialog(html, "これはただのタイトル");
}

/**
 * そのまんま受け取る場合
 * @param {*} weekday 
 * @param {*} period 
 * @param {*} subject 
 * @param {*} url 
 * @returns 
 */
function setData(weekday, period, subject, url){
  const expectedColLength = 4;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("htmlからデータ追加");
  if(sheet === null){
    console.error("シートが見つからないよ〜");
    throw new Error("シートが見つからないよ〜");
  }
  const range = sheet.getDataRange();
  if(range.getWidth() !== expectedColLength){
    console.error(`シートの幅が違うよ〜`);
    throw new Error("シートの幅が違うよ〜");
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
      throw new Error(`ヘッダー ${headerLabel} が見つからないよ〜`);
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

function getDataTest(obj){
  console.log(obj);
  // // objectをjsonオブジェクトとして扱いたいので、フロント側でやったようにStringifyしてからパースする
  // obj = JSON.parse(JSON.stringify(obj)); // 意味なかった
  // objectからmapに変換する方法 https://zenn.dev/terrierscript/articles/2021-04-02-java-script-object-entities
  const mappedObj = new Map(Object.entries(obj));
  const expectedColLength = 3;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("htmlからデータ追加2");
  if(sheet === null){
    console.error("シートが見つからないよ〜");
    throw new Error("シートが見つからないよ〜");
  }
  const range = sheet.getDataRange();
  if(range.getWidth() !== expectedColLength){
    console.error(`シートの幅が違うよ〜`);
    throw new Error("シートの幅が違うよ〜");
  }
  const headerRange = sheet.getRange("A1:1");
  const headerValues = headerRange.getValues()[0].filter(e=>e !== "");
  // ヘッダー（先頭行）のカラムの存在確認と入れる場所のインデックス確保
  const indexByLabel = new Map();
  for(const headerLabel of mappedObj.keys()){
    if(headerValues.indexOf(headerLabel) === -1){
      console.error(`ヘッダー ${headerLabel} が見つからないよ〜`);
      throw new Error(`ヘッダー ${headerLabel} が見つからないよ〜`);
    }
    indexByLabel.set(headerLabel, headerValues.indexOf(headerLabel));
  }
  const data = new Array(expectedColLength);
  mappedObj.forEach((v, k) => {
    // objectのうち配列だけはいまのところなんとかこうやって操作できる（要素にobjectを含まないものとする）
    if(Array.isArray(v))v = v.join(",");
    data[indexByLabel.get(k)] = v;
  });
  sheet.appendRow(data);
}


/**
 * SpreadSheetの拡張したmenuではブラウザ側での動作になるので、
 * 明示的に呼び出さないとApps Script側のメソッドは呼び出せないよの例
 * ここではincludeを呼び出そうとして失敗している
 * （明示的に呼び出す例ではないです）
 */
function invokeScriptletOnMenu_(){
  const html = HtmlService.createHtmlOutputFromFile("ignoreScriptletOnMenu").setWidth(400).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, "タイトルだよ");
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/**
 * ブラウザ側のhtml一枚のscriptにvueをcdnでインポートし、かつscriptを記述する、
 * ことをやり、以下を実現してみる
 * Googleドライブ上の画像のIDを入力し、それをbase64形式で表示する
 * （ドライブ上の共有用のURLだと、safariなどで読み込めない場合があるので） 
 */
function invokeScriptletOnMenu2_(){
  const html = HtmlService.createHtmlOutputFromFile("applyVueOnMenu").setWidth(600).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, "タイトルだよ");
}

function t(){
  try{
    const f = DriveApp.getFileById("diofja;ejfaoidjfoaf");
    console.log(f.getName());
  }catch(e){
    console.log(e);
  }
}

/**
 * Google Drive上の画像IDからその画像のbase64urlを取得
 * @param {String} fileId 
 * @returns {String} ret - formatedBase64Url
 */
function getBase64UrlOnDriveImage(fileId){  
  // check
  // - Drive上にあるか
  // - アクセスできるか
  // - 画像ファイルかどうか
  console.log(`やるよ: ${fileId}`);
  try{
    const file = DriveApp.getFileById(fileId);
    if(file === null){
      console.error("ドライブ上のファイルじゃないかもよ");
      throw new Error("is this file on Google Drive?");
    }
    if(!accesibleDrive(file)){
      console.error("アクセスできないよ permission not `ANYONE_WITH_LINK`");
      throw new Error("permission not `ANYONE_WITH_LINK`");
    }
    if(!typeOfImage(file)){
      console.error("画像ファイルじゃないよ");
      throw new Error("not image file?");
    }
    const ret = createImageBase64(file);
    return ret;
  }catch(e){
    console.error("エラーなんとちがうん？");
    console.error(e);
    throw new Error(e);
  }
}

/**
 * Googleドライブに存在かつアクセスできる？
 */
function accesibleDrive(file){
  return file.getSharingAccess().toString() === "ANYONE_WITH_LINK";
}
/**
 * 画像ファイルかどうか MIMEで判断できそうじゃん
 */
function typeOfImage(file){
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  const imageMimeTypes = ["image/jpeg", "image/png", "image/svg+xml"];
  return imageMimeTypes.includes(file.getMimeType());
}

/**
 * Googleドライブ上にある画像ファイルをbase64形式で返す
 */
function createImageBase64(file){
  const fileBlob = file.getBlob();
  const base64Data = Utilities.base64Encode(fileBlob.getBytes());
  const contentType = fileBlob.getContentType();
  const base64Url = "data:" + contentType + ";base64," + base64Data;
  return base64Url;
}

