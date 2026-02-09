# 一級建築士 学科｜回転フェーズ学習ガント

GitHub Pages向けの静的Webアプリです。
月次目標・週次目標・日次ToDoを連動し、重点科目ローテーションを見える化します。

## ファイル構成
- `/Users/ookoshikanpei/Desktop/codex/index.html`
- `/Users/ookoshikanpei/Desktop/codex/styles.css`
- `/Users/ookoshikanpei/Desktop/codex/app.js`
- `/Users/ookoshikanpei/Desktop/codex/data/plan.json`

## 対応内容
- 週次 + 月次ガント（〜2026/07）
- 科目ごとの正式単元名をJSONに収録
- 予習/演習の2レーン表示
- 週運用：重点1 + 維持2〜3のローテーション
- 平日（通勤枠）/休日（演習2〜3h）を分離表示
- 法規5分/問ルール表示
- 今日の指令は今週（月〜日）を横スワイプ表示（週内の過去日も残る）
- スワイプ内の各日ToDoはチェック可能（日次チェック）
- 毎日の「持ち物（通勤パック）」表示
- 今日の目標（自由記載）を日付単位で保存
- ToDoは「科目 / 単元 / 教材 / やり方 / 時間」の具体形式で固定
- バランス問題集は「全科目ミックス3問前後ずつ」で統一
- 日付が変わると「今日のToDo」を自動で翌日分に更新（表示復帰時も再判定）
- 手動チェックなし・日付基準の自動遅延判定
- Notion風の明るい背景 + パステル + イエローアクセント
- 折りたたみ表示（月次・週次）
- スマホ幅（420px前後）までの可変レイアウト最適化

## 端末間同期（スマホ/PC共有）
`今日の指令` の「端末間同期（任意）」で設定できます。

1. GitHub Personal Access Token（`repo` 権限）を発行
2. アプリの `GitHub PAT` に入力して `同期を有効化`
3. 別端末でも同じトークンで有効化
4. 以後、チェック更新は `data/progress.json` に保存されて共有される

注意:
- トークンは各端末のブラウザ `localStorage` に保存されます
- 共有データを先に反映したいときは `最新を取得` を押してください

## ローカル確認
```bash
python3 -m http.server 8080
```
`http://localhost:8080` を表示

## GitHub Pages
1. リポジトリへ push
2. `Settings > Pages`
3. `Deploy from a branch`
4. `main` / `(root)` を指定

## JSON編集ガイド
### 重要キー
- `months[]`: 月次目標とフェーズ
- `weeks[]`: 週次期間、重点科目、維持科目、重点単元
- `unitCatalog`: 科目ごとの正式単元名
- `rules`: 学習運用ルール

### 週追加の最小セット
- `id`
- `label`
- `monthId`
- `start`
- `end`
- `focus`
- `support`
- `focusUnits`
