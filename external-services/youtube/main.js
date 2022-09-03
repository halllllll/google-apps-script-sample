const ss = SpreadsheetApp.getActive();
const EXPECTED_HEADER = [`publisheDate`,`thumbnail`, `title`, `videoID`, `url`, `status`, `schedule`];
const STATUS_NAMES_TABLE = new Map([["public", "公開"], ["unlisted", "限定公開"], ["private", "非公開"]]);
const STATUS_NAMES = Array.from(STATUS_NAMES_TABLE.keys());
class MyVideo{
  /**
   * @param {Date} publishDate
   * @param {string} videoId
   * @param {string} title
   * @param {string} thumbnail
   * @param {string} url
   * @param {string} status
   */
  constructor(publisheDate, videoId, title, thumbnail, url, status){
    this.publisheDate = new Date(publisheDate);
    this.videoID = videoId;
    this.title = title;
    this.thumbnail = thumbnail;
    this.url = url;
    this.status = status;
  }

  /**
   * @param {string[]} nameOrder
   * @return {Array}
   */
  getPropertiesByOrder(nameOrder){
    const ret = [];
    for(let name of nameOrder){
      if(this[name] === undefined){
        ret.push(null);
      }else{
        ret.push(this[name]);
      }
    }
    return ret;
  }
}

/**
 * 10進数をA1表記(列)に変換
 * @param {number}  数値
 * @return {string} A1表記
 */

const colNumToA1_ = (d) => {
  if(!Number.isInteger(d)){
    throw new Error(`${d} is not Integer.`);
  }

  if(d<=0){
    throw new Error(`${d} is invalid. should be more than 1.`);
  }    
  const alphabets = [`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`,`Z`];
  const res = [];
  for (; d > 0; d = parseInt((d - 1) / 26)){
      res.push(alphabets[(d - 1) % 26]);
  }
  return res.reverse().join(``);
}

/**
 * A1表記を10進数に変換
 * @param {string} A1表記
 * @return {number} 数値
 */
const a1ToColNum_ = (strCol) => { 
  let m = strCol.toString().match(/^([a-zA-Z]+?)+/g);
  if(!m || m.length!=1){
    throw new Error(`${strCol} is invalid, it's not alphabet sequence by head.`);
  }
  strCol = m[0];
  let iNum = 0;
  let temp = 0;
  
  strCol = strCol.toUpperCase();  // Asciiコードで計算するので
  for (i = strCol.length - 1; i >= 0; i--) {
    temp = strCol.charCodeAt(i) - 65; // 現在の文字番号;
    if(i != strCol.length - 1) {
      temp = (temp + 1) * Math.pow(26,(i + 1));
    }
    iNum = iNum + temp
  }
  return iNum;
}

const retrieveMyVideos = () => {
    let nextPageToken = "";
    const videoData = [];
    while(nextPageToken !== null){
      const videos = YouTube.Search.list("id,snippet", {
        forMine: true,
        maxResults: 50,
        type: "video",
        order: "date",
        pageToken: nextPageToken,
      });
      nextPageToken = videos.nextPageToken === undefined ? null : videos.nextPageToken;
      // とりあえずvideo IDだけあればいい
      // statusを取得するにはVideo.listを叩く。そのときについてくるデータを使う
      const videosId = videos.items.map(v=>v.id.videoId);
      const videosInfo = YouTube.Videos.list("snippet,status", {id: videosId.join(",")});
      videosInfo.items.forEach(v=>{
        const myVideo = new MyVideo(v.snippet.publishedAt, v.id, v.snippet.title, v.snippet.thumbnails.default.url, `http://www.youtube.com/watch?v=${v.id}`, v.status.privacyStatus);
        videoData.push(myVideo);
      });
    }
    return videoData;
};

const updateList_ = () => {
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getActiveSheet();
  const user = Session.getActiveUser();
  const answer = ui.alert(
    `${user.getEmail()}のYoutubeのデータを反映します\n(残quotaにはお気をつけください)`,
    ui.ButtonSet.YES_NO,
  );
  if(answer === ui.Button.NO){
    return;
  }else if(answer === ui.Button.YES){
    try{
      // 取得したやつと今のsheet上のやつを比較して必要なもので再構成する
      let fieldRange = sheet.getDataRange();
      const header = fieldRange.offset(0, 0, 1);
      const headerValues = header.getValues()[0];
      console.log(`headerValues: ${headerValues}`);
      const videoIDIdx = headerValues.indexOf("videoID");
      const thumbnailIdx = headerValues.indexOf("thumbnail");
      const titleIdx = headerValues.indexOf("title");
      if(videoIDIdx===-1)throw new Error(`can't find "videoID" on header`);
      if(thumbnailIdx===-1)throw new Error(`can't find "thumbnail" on header`);
      if(titleIdx===-1)throw new Error(`can't find "title" on header`);
      const myVideos = retrieveMyVideos();
      const result = [];
      if(fieldRange.getHeight()>1){
        // すでになにかが入ってる場合
        fieldRange = fieldRange.offset(1, 0, fieldRange.getHeight()-1); 
        // ヘッダー以下取得
        const currentDisplayedValues = fieldRange.getValues();
        // 取得したやつに存在しているが現在のsheetに存在していないもの -> 取得したやつを追加
        // 取得したやつにもsheetにも存在しているもの -> 現在のものをそのまま使う
        // 取得したやつに存在していないがsheetにはある -> 無視（なにもしない）
        for(let videoInfo of myVideos){
          console.log(`info: ${videoInfo}`);
          const preSize = result.length;
          for(let curValue of currentDisplayedValues){
            if(videoInfo.videoID === curValue[videoIDIdx]){
              result.push(curValue);
              continue;
            }
          }
          if(preSize!==result.length)continue;
          const videoValue = videoInfo.getPropertiesByOrder(headerValues);
          result.push(videoValue);
        }
      }else{
        // まだなんもない場合
        fieldRange = header.offset(1, 0, 1);
        myVideos.forEach((videoInfo, idx) => {
          const videoValue = videoInfo.getPropertiesByOrder(headerValues);
          result.push(videoValue);
        });
      }
      // 現在のやつはまっさらにする
      fieldRange.clear();
      fieldRange.setBorder(false, false, false, false, false, false);
      // 以下今回取得したもの
      fieldRange = fieldRange.offset(0, 0, result.length);
      fieldRange.setBorder(true, true, true, true, true, true, "black", SpreadsheetApp.BorderStyle.SOLID);
      fieldRange.setWrap(true);

      // thumbnail 比較のループで一緒にやろうと思ったけどめんどくさくなったのでここでやる
      const builder = SpreadsheetApp.newCellImage();
      for(let [idx, row] of result.entries()){
        const thumbnailUrl = row[thumbnailIdx];
        const title = row[titleIdx];
        const img = builder.setSourceUrl(thumbnailUrl).setAltTextTitle(title).toBuilder().build();
        row[thumbnailIdx] = img;
        result[idx] = row;
      } 
      fieldRange.setValues(result);
      ui.alert("処理が完了しました");
    }catch(e){
      console.error(e);
      ui.alert(e);
    } 
  }
}

/**
 * トリガー関数
 * トリガーで呼ばれる関数自身が第一引数に入る
 */
const setStatusTrigger_ = (triggerObj) =>{
  const triggerId = triggerObj.triggerUid;
  const properties = PropertiesService.getScriptProperties();
  const jsonizedTriggerProp = properties.getProperty(`args_${triggerId}`);
  if(jsonizedTriggerProp === null){
    console.error(`can't find "args_${triggerId}" in script properties.\nthis trigger don't be fired.`);
    return;
  }
  const propsObj = JSON.parse(jsonizedTriggerProp);
  const curStatus = YouTube.Videos.list("status",{
    id: propsObj.videoIdInput,
  });
  const newStatus = curStatus;
  newStatus.privacyStatus = propsObj.nextStatus;
  const resource = {
    status: newStatus,
    id: propsObj.videoIdInput,
  };
  YouTube.Videos.update(resource, 'id,status');

  const targetRowNum = getRowNumByVideoId_(propsObj.videoIdInput);
  const scheduleCol = colNumToA1_(EXPECTED_HEADER.indexOf(`schedule`)+1);
  const targetCell = ss.getRange(`${scheduleCol}${targetRowNum+1}`);
  const statusCol = colNumToA1_(EXPECTED_HEADER.indexOf(`status`)+1);
  const statusCell = ss.getRange(`${statusCol}${targetRowNum+1}`);
  targetCell.setBackground("#ffffff");
  targetCell.setValue("");
  statusCell.setValue(propsObj.nextStatus);
  deleteTriggerById_(triggerId);
  deletePropertyByKey_(`args_${triggerId}`);
  return;
}

const deleteTriggerById_ = (triggerId) => {
  const triggers = ScriptApp.getScriptTriggers();
  for(let trigger of triggers){
    if(trigger.getUniqueId() === triggerId){
      ScriptApp.deleteTrigger(trigger);
      break;
    }
  }
}

const deletePropertyByKey_ = (key) => {
  const properties = PropertiesService.getScriptProperties();
  const propertyKeys = properties.getKeys();
  if(propertyKeys.indexOf(key) !== -1){
    properties.deleteProperty(propertyKeys.indexOf(key));
  }
}

const getRowNumByVideoId_ = (videoId) =>{
  const videoIdCol = colNumToA1_(EXPECTED_HEADER.indexOf(`videoID`)+1);
  const videoIdRange = ss.getRange(`${videoIdCol}1:${videoIdCol}`); // ヘッダーを含むようにする（たぶんvideoIDっていう名前のvideoIdは無い）
  const videoIdVal = videoIdRange.getValues().flat().filter(e=>e!=="");
  const targetRow = videoIdVal.indexOf(videoId);
  if(targetRow === -1){
    throw new Error(`videoID ${videoId} is not found.`);
  }
  return targetRow;
}

const scheduleUpdate = (formDataObj) =>{
  const mappedObj = new Map(Object.entries(formDataObj));
  for(let [k, v] of mappedObj.entries()){
    console.log(k, v);
  }
  if(!mappedObj.has("videoIdInput") || !mappedObj.has("scheduledTime") || !mappedObj.has("nextStatus")){
    throw new Error(`can't find property.`);
  }
  const videoId = mappedObj.get("videoIdInput");
  const schedule = mappedObj.get("scheduledTime");
  const nextStatus = mappedObj.get("nextStatus");

  const targetRowNum = getRowNumByVideoId_(videoId);
  const properties = PropertiesService.getScriptProperties();
  const trig = ScriptApp.newTrigger("setStatusTrigger_").timeBased().at(new Date(schedule)).create();
  const trigUUID = trig.getUniqueId();
  properties.setProperty(`args_${trigUUID}`, JSON.stringify(formDataObj));
  // 予約後処理
  const scheduleCol = colNumToA1_(EXPECTED_HEADER.indexOf(`schedule`)+1);
  const targetCell = ss.getRange(`${scheduleCol}${targetRowNum+1}`);
  targetCell.setBackground("#d39a45");
  targetCell.setValue(`next status: "${nextStatus}" on ${Utilities.formatDate(new Date(schedule), "Asia/Tokyo", "yyyy-MM-dd HH:mm")}`);
}


const scheduleStatusUpdateMenu_ = () => {
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getActiveSheet();
  const ranges = sheet.getDataRange();
  const values = ranges.getValues();
  values.shift();
  const header = ranges.offset(0, 0, 1);
  const headerValues = header.getValues()[0];
  let selection = "";
  let radiobuttons = "";
  try{
    const videoIDIdx = headerValues.indexOf("videoID");
    const titleIdx = headerValues.indexOf("title");
    const statusIdx = headerValues.indexOf("status");
    if(videoIDIdx===-1)throw new Error(`can't find "videoID" on header`);
    if(titleIdx===-1)throw new Error(`can't find "title" on header`);
    if(statusIdx===-1)throw new Error(`can't find "status" on header`);
    for(let row of values){
      let title = row[titleIdx].slice(0, 22).trim();
      if(row[titleIdx].length>10)title += "...";
      selection += `<option value="${row[videoIDIdx]}">${title}</option>`;
    }
    let checkedFlag = false;
    STATUS_NAMES_TABLE.forEach((v, k) => {
      radiobuttons += `<label for="${k}"><input type="radio" name="nextStatus" value="${k}" id="${k}" ${checkedFlag ? "" : "checked"}>${v}</label>`;
      checkedFlag = true;
    });
  }catch(e){
    ui.alert(e);
    return;
  }

  const html = HtmlService.createTemplateFromFile("modal_schedule");
  html.selection = selection;
  html.radiobuttons = radiobuttons;
  const underTime = new Date();
  underTime.setMinutes(underTime.getMinutes()+30);
  html.curTime = Utilities.formatDate(underTime, "Asia/Tokyo", "yyyy-MM-dd HH:mm");
  SpreadsheetApp.getUi().showModalDialog(html.evaluate(), "動画ステータス変更");
}

const onOpen = e => {
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getActiveSheet();
  const headerRange = sheet.getRange(`A1:${colNumToA1_(EXPECTED_HEADER.length)}1`);
  // とりあえず毎回セットする
  headerRange.setValues([EXPECTED_HEADER]);
  headerRange.setBorder(true, true, true, true, false, false, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  headerRange.setFontStyle("bold");
  headerRange.setWrap(true);

  menu = ui.createMenu("Youtube動画更新メニュー");
  menu.addItem("Sheet更新", "updateList_");
  menu.addItem("公開状況更新予約", "scheduleStatusUpdateMenu_");
  menu.addToUi();
}