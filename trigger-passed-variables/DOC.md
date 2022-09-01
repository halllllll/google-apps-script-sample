# Triggerに変数を渡したい

全部こちらを参考にしました [GASのトリガーで関数に引数を渡したい - teratail](https://teratail.com/questions/325054)

Triggerには自身の固有のIDを取得できるメソッドがある（[Class Trigger#getUniqueId()](https://developers.google.com/apps-script/reference/script/trigger?hl=en#getUniqueId())）。そして、Triggerのイベントが発火したときには、その関数に固有のイベントオブジェクトが第一引数に渡される。ちょうど`doGet(e)`のように。Triggerのイベントオブジェクトについてはこちらを参照 [Event Objects](https://developers.google.com/apps-script/guides/triggers/events?hl=en)

Apps Script内からTriggerを作成するには`ScriptApp.newTrigger("TriggerName").timeBased().at(t).create();`みたいな感じで`newTrigger`を使って作成する。（参考: [Class T riggerBuilder](https://developers.google.com/apps-script/reference/script/trigger-builder?hl=en)）このとき、指定した時間に指定した関数の名前でTriggerが予約される。指定できるのは関数名だけなので、一見して変数を渡すことができないように思える。これに悩んでいたが、`Trigger ID`と`Property Service`を使って、いい感じにTriggerに変数を渡しているような雰囲気になれた。

## ポイント
- Trigger ID
- Property Service
- JSON文字列でProperty Serviceに登録して、取り出してからparseする