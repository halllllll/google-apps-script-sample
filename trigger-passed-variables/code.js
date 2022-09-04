/**
 * entry point
 */
function myFunction() {
  const numbers = [1, 6, 11, 16]; // 特に意味はない　配列とかもObjにしてJSONで固めればTriggerに変数のように使えるということを示すだけのデモのための変数代表の配列
  for(let n of numbers){
    const range = (start, stop) => Array.from({length: stop-start}, (_, i) => start + i+1);
    const obj = {
      created: new Date(),
      ended: null,
      n: n,
      arr: range(n, n+5),
    }
    genTrigger(obj);
  }
  console.log(`gogogogogo`);
}

/**
 * @param {Object} obj - args to trigger
 */
const genTrigger = (obj) => {
  const t = new Date();
  t.setFullYear(t.getFullYear());
  t.setMonth(t.getMonth());
  t.setDate(t.getDate());
  t.setHours(t.getHours());
  t.setMinutes(t.getMinutes()+1);
  const trig = ScriptApp.newTrigger("myTrigger").timeBased().at(t).create();
  const tuid = trig.getUniqueId(); // ポイント Trigger.getUniqueIdをキーにしてPropertyに保存する
  console.log(`my id... ${tuid}`);
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(`prop_${tuid}`, JSON.stringify(obj)); // ポイント JSON文字列にしてPropertyにストアしていろんな値（変数）をトリガーから複数使えるようにする
  console.log(`settled!!! ${properties.getProperty(`prop_${tuid}`)}`);
}

/**
 *  これがトリガー関数
 * @param {Object} triggerObj - トリガー関数を生成した関数オブジェクト
 */
const myTrigger = (triggerObj) => { // トリガー関数の第一引数にはもともとの関数オブジェクト（ここでいうgenTrigger）が渡されるらしい
  const triggerId = triggerObj.triggerUid; // ポイント triggerObj.triggerUidはこのmyTriggerを呼んだgenTrigger内で生成したTriggerオブジェクトのgetUniqueIdメソッドの返り値 
  console.log(`trigger unique id? ${triggerId}`); 
  const properties = PropertiesService.getScriptProperties();
  const jsonObj = properties.getProperty(`prop_${triggerId}`);
  if(jsonObj === null){
    // なぜかPropertyService内にtriggerIdに対するバリュー（オブジェクト）が存在しない場合はとりあえず終了　このへんはまだ適当
    console.log(`json obj? ${jsonObj}`);
    return;
  }
  const obj = JSON.parse(jsonObj); // ポイント 変数然として渡されたJSON文字列をパースしてオブジェクトとして使えるようにする
  /**
   * ここでなんかいろいろする
   */
  // next trigger object 
  obj.ended = new Date();
  obj.arr = obj.arr.map((v, i)=>v+i);
  // delete cur trigger and thats property
  deleteTriggerById(triggerId);
  deletePropertyByKey(`prop_${triggerId}`);
  // デモだし70分くらい経ったら終わらせることにする
  const limitTime = 70 * 60 * 1000;
  const dif = new Date(obj.ended).getTime() - new Date(obj.created).getTime();
  const M = Math.floor(dif / (60*1000));
  const s = Math.floor(M%60);
  console.log(`開始から${M}分${s}秒経過`);
  if(limitTime < dif){
    console.log(`開始から${limitTime}ミリ秒経ったのでおわり`);
    return;
  }
  genTrigger(obj);
}

const deleteTriggerById = (triggerId) => {
  const triggers = ScriptApp.getScriptTriggers();
  for(let trigger of triggers){
    if(trigger.getUniqueId() === triggerId){
      ScriptApp.deleteTrigger(trigger);
      break;
    }
  }
}

const deletePropertyByKey = (key) => {
  const properties = PropertiesService.getScriptProperties();
  const propertyKeys = properties.getKeys();
  if(propertyKeys.indexOf(key) !== -1){
    properties.deleteProperty(propertyKeys.indexOf(key));
  }
}


/**
 * デバッグ用
 */
const deleteAllTriggersAndProperties = () => {
  const triggers = ScriptApp.getScriptTriggers();
  for(let trigger of triggers){
    ScriptApp.deleteTrigger(trigger);
  }
  const properties = PropertiesService.getScriptProperties(); 
  properties.deleteAllProperties();
}