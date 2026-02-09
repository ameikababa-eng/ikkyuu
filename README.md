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
- 今日のToDoチェックボックス（当日分をlocalStorageに保存）
- 日付が変わると「今日のToDo」を自動で翌日分に更新（表示復帰時も再判定）
- 手動チェックなし・日付基準の自動遅延判定
- Notion風の明るい背景 + パステル + イエローアクセント
- 折りたたみ表示（月次・週次）
- スマホ幅（420px前後）までの可変レイアウト最適化

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
