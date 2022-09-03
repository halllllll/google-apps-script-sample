# Youtube Data APIを使って公開情報の管理をするデモ
Google Apps Scriptから`Youtube Data API v3`を使えるので使ってみる。

[デモ用Spreadsheet](https://docs.google.com/spreadsheets/d/1t0c9-BrbR8vBjtDA3uJ4iSDL_j9fesFpuUjJuJ2mBgQ/edit?usp=sharing)

# 内容

- SpreadSheetのSheet上に、ログインしているGoogleアカウントのYoutubeへの投稿動画のデータを表示
  - カスタムメニューをSpreadSheet上に表示しており、そこからエントリーする（`"Youtube動画更新メニュー`ボタン）
- カスタムメニューの`Sheet`更新（`updateList_`メソッド）でログインしているGoogleアカウントのYoutube動画をリスト表示する
  - 試した限りではブランドアカウントはダメだった
  - 投稿動画数によっては確実にエラーになって途中で失敗する。`quota`を食うため
  - 大した情報は表示しない。`quota`を食うため
  - [YouTube Data API (v3) - Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
    - Google Apps ScriptからYoutube APIを使ったときの`quota`の消費量を確認する術が存在するのかどうかわからない。もちろん超過するとエラーになる。試した時点では一般無料アカウントの制限と同じく10,000quotaのようである。もちろんユーザー単位で紐付く。
- 特定の動画の公開設定の変更を予約する
  - カスタムメニューの`公開状況更新予約`（`scheduleStatusUpdateMenu_`メソッド）
  - `modal_schedule.html`をモーダルで表示、中にフォームがある
  - 時間と動画IDと公開設定が必要


# memo
- `CellImage`
  - 初めて使った。SpreadSheetのセルに画像を埋め込むやつ
  - [ここ](https://developers.google.com/apps-script/reference/spreadsheet/cell-image?hl=enhttps://developers.google.com/apps-script/reference/spreadsheet/cell-image?hl=en)
- 外部API
- Youtube API
  - Google Apps Scriptから使うとアクセストークンとか専用のKeyとか一切必要ないのが楽
  - Gogole Apps Scriptから使ったときの`quota`消費量や残`quota`を確認する術がわからず
- カスタムメニューからのI/O
  - `<input type="datetime-local">`初めて知った
- `Trigger`に変数を渡すような感じで使う
  - `Trigger ID`ってのがあり、それをキーにして`PropertyService`で変数を扱う
  - [trigger-passed-variables](https://github.com/halllllll/google-apps-script-sample/tree/master/trigger-passed-variables)のデモで使ったものと同じ仕組み
- `FormData`は`JSON.stringify`で固めていい
- 予約した変更予定のキャンセル処理は未実装
- もっと軽めのごく簡単なWebアプリでもいいかもしれない。動画IDを入力して公開設定を変えるだけのもの。