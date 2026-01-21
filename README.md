# NPB 順位予想集計ツール

日本プロ野球（NPB）のセ・パ両リーグの順位予想を入力し、集計・一覧表示するためのWebツールです。
Google SheetsとGoogle Apps Script (GAS) を利用したサーバーレス構成で動作します。

## 機能

- **順位予想入力**:
    - ドラッグ＆ドロップで直感的にチーム順位を入れ替え可能。
    - 名前を入力して送信。
- **集計結果表示**:
    - 登録された全員の予想を一覧表示。
    - チームカラー背景＋白文字で見やすく表示。
- **データ保存**:
    - Google Sheetsにデータを自動蓄積。

## ディレクトリ構成

```
.
├── backend/
│   ├── code.gs       # Google Apps Script コード (APIエンドポイント)
│   └── README.md     # バックエンド(GAS)のセットアップ手順書
├── frontend/
│   ├── index.html    # メイン画面 HTML
│   ├── style.css     # スタイルシート
│   └── script.js     # フロントエンドロジック (API連携, DnD処理)
└── README.md         # 本ファイル
```

## セットアップ手順

### 1. バックエンド (GAS) の準備
まず、Google SheetsとGASの準備が必要です。
詳細は [backend/README.md](./backend/README.md) を参照してください。

### 2. フロントエンドの設定
1. `frontend/script.js` を開きます。
2. 3行目の `API_URL` を、バックエンドの準備で取得した「ウェブアプリ URL」に書き換えてください。

```javascript
const API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec';
```

### 3. 利用開始
`frontend/index.html` をブラウザで開くだけで利用可能です。
GitHub Pagesや、その他任意のWebサーバーに配置しても動作します。

## 開発者向け情報
- **使用技術**: HTML5, CSS3, Vanilla JavaScript, Google Apps Script
- **デザイン**: チームカラーをベースにした視認性の高いテーブルデザイン
- **入力UI**: HTML5 Drag and Drop API を使用

## ライセンス
MIT License
