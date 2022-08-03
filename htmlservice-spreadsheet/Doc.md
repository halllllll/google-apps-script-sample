# htmlservice-spreadsheet
Google Apps Scriptのうち、主に[HTML Service](https://developers.google.com/apps-script/reference/html?hl=en)のAPIを用いるもの。よく忘れるのでおいておく。手癖でSpreadSheetでやった

# Live Sample
これもおいておく。コピーできるようにしておく

[SpreadSheetの共有URL](https://docs.google.com/spreadsheets/d/1vC-9rMg6YJMziMn1D0Yf1x2bMBMspmTIeahTerIg7fI/edit?usp=sharing)

# TOC(WIP)
- GUIカスタムメニューから使う。Webアプリは含まれない。
- `HtmlTemplate`でscriptletを使うサンプル
- `google.script.run`によるデータ送受信とSheetの更新
- **Webアプリは含まれない**の制約に関して、Apps Scriptが返すhtmlコンテンツだと内部でscriptletが動作するが、フロントで完結するmenuからだとscriptletが効かない。htmlのscriptタグに含めたスクリプトは有効