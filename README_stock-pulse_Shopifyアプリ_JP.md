# StockPulse — リアルタイム在庫アラート＆分析ダッシュボード

> **何を:** 在庫が閾値を下回ったら即Slack通知し、在庫推移グラフで仕入れ判断をサポートするShopify Embedded App
> **誰に:** 全Shopifyマーチャント（在庫管理の効率化を求める運用チーム）
> **技術:** Remix · TypeScript · Prisma + SQLite · Polaris React · Recharts · Shopify GraphQL Admin API · Slack Incoming Webhooks

**ソースコード:** [github.com/mer-prog/stock-pulse](https://github.com/mer-prog/stock-pulse)

---

## このプロジェクトで証明できるスキル

| スキル | 実装内容 |
|--------|----------|
| Shopifyアプリ開発 | Shopify App Template (Remix) ベースのEmbedded App。OAuth認証、Webhook受信（`inventory_levels/update`）、GraphQL Admin APIによる在庫データ取得を実装 |
| リアルタイムデータ処理 | Shopify Webhookによる在庫変動の即時検知。閾値チェック→Slack通知を自動実行、60分間のスロットリングで重複通知を防止 |
| データ可視化 | Rechartsによる在庫推移の折れ線グラフ。全体30日トレンドと商品別トレンドの2種類を実装 |
| データベース設計 | Prisma ORMで4モデル（Session / InventorySnapshot / AlertConfig / AlertLog）を設計。時系列クエリ用の複合インデックス、商品別閾値のユニーク制約を実装 |
| アラートシステム設計 | 全商品共通のデフォルト閾値と商品別の個別閾値をフォールバックパターンで実装。在庫切れ・低在庫の2段階アラート |
| フルスタック実装 | Remixのloader/actionパターンでフロント・バックエンドを統合。サービス層（在庫同期・アラートチェック・Slack通知）を分離した3層構成 |
| 国際化（i18n） | React Context + localStorageによる日英切替。60キーの翻訳ファイル、パラメータ補間対応 |

---

## 技術スタック

| カテゴリ | 技術 | バージョン | 用途 |
|----------|------|-----------|------|
| フレームワーク | Remix (Shopify App Template) | ^2.16.1 | SSR、ファイルベースルーティング、loader/actionパターン |
| 言語 | TypeScript | ^5.2.2 | 型安全な開発（strict mode有効） |
| UIライブラリ | Polaris React | ^12.0.0 | Shopify管理画面準拠のUIコンポーネント |
| グラフ | Recharts | ^3.8.0 | 在庫推移の折れ線グラフ描画 |
| データベース | Prisma + SQLite | ^6.2.1 | ORM、マイグレーション管理、セッションストレージ |
| API | Shopify GraphQL Admin API | 2025-01 | 在庫データの一括取得（inventoryItems クエリ） |
| 認証 | Shopify App Bridge React | ^4.1.6 | Embedded App認証、OAuth管理 |
| セッション管理 | shopify-app-session-storage-prisma | ^8.0.0 | Prismaベースのセッション永続化 |
| 通知 | Slack Incoming Webhooks | — | 在庫アラートの即時送信 |
| ビルドツール | Vite | ^6.2.2 | HMR、本番ビルド |
| ランタイム | Node.js | >=20.19 <22 \|\| >=22.12 | サーバー実行環境 |
| コード品質 | ESLint + Prettier | ^8.42.0 / ^3.2.4 | リンティング・フォーマット |

---

## アーキテクチャ概要

```
┌──────────────────────────────────────────────────────────────────┐
│                    Shopify Admin (埋め込みアプリ)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Polaris React UI                         │  │
│  │  ダッシュボード │ アラート設定 │ 商品別詳細                 │  │
│  │  (サマリカード)   (閾値設定)     (バリアント在庫)           │  │
│  │  (推移グラフ)     (Slack URL)    (個別推移グラフ)           │  │
│  │  (低在庫一覧)                                              │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          │ Remix loader / action                  │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │                     Remix サーバー                          │  │
│  │  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐   │  │
│  │  │ inventory-    │ │ alert-       │ │ slack-          │   │  │
│  │  │ sync          │ │ checker      │ │ notifier        │   │  │
│  │  │ .server.ts    │ │ .server.ts   │ │ .server.ts      │   │  │
│  │  │ (239行)       │ │ (63行)       │ │ (36行)          │   │  │
│  │  └──────┬────────┘ └──────┬───────┘ └────────┬────────┘   │  │
│  │         │                 │                   │            │  │
│  └─────────┼─────────────────┼───────────────────┼────────────┘  │
│            │                 │                   │               │
└────────────┼─────────────────┼───────────────────┼───────────────┘
             │                 │                   │
     ┌───────▼───────┐        │           ┌───────▼───────┐
     │ Shopify       │        │           │ Slack         │
     │ GraphQL API   │        │           │ Webhook API   │
     │ (在庫データ)   │        │           │ (アラート通知) │
     └───────────────┘        │           └───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Prisma + SQLite   │
                    │ InventorySnapshot │
                    │ AlertConfig       │
                    │ AlertLog          │
                    │ Session           │
                    └───────────────────┘

             ┌────────────────────────────────┐
             │ Shopify Webhook                │
             │ inventory_levels/update        │
             │        │                       │
             │        ▼                       │
             │ InventorySnapshot作成          │
             │        │                       │
             │        ▼                       │
             │ alert-checker (閾値チェック)    │
             │        │                       │
             │        ▼                       │
             │ slack-notifier (通知送信)      │
             └────────────────────────────────┘
```

---

## 主要機能

### 1. 在庫ダッシュボード（`app/routes/app._index.tsx` — 100行）
4枚のサマリカード（総商品数 / 在庫切れ商品数 / 低在庫商品数 / 在庫総数）をグリッド表示。在庫推移の折れ線グラフ（直近30日）を`StockChart`コンポーネントで描画。閾値以下の低在庫商品を`ProductStockTable`で一覧表示。「在庫同期」ボタンで手動の全在庫同期を実行可能。

### 2. 在庫同期エンジン（`app/services/inventory-sync.server.ts` — 239行）
Shopify GraphQL Admin APIの`inventoryItems`クエリで全在庫をページネーション付き（50件/ページ）で取得。各InventoryItemのバリアントID・商品IDを紐付け、全ロケーションの在庫数を合算し、`InventorySnapshot`としてPrismaに保存。取得用関数も4つ提供: `getInventorySummary()`（サマリ集計）、`getInventoryHistory()`（時系列データ）、`getLowStockProducts()`（低在庫商品抽出）、`syncAllInventory()`（全同期）。

### 3. Webhookリアルタイム更新（`app/routes/webhooks.inventory-levels-update.tsx` — 55行）
Shopifyの`inventory_levels/update` Webhookを受信。既存のSnapshotから商品ID・バリアントIDを逆引きし、新しい`InventorySnapshot`を作成。その後`checkAndAlert()`で閾値チェックを自動実行。未同期のInventoryItemはスキップ（初回同期が必要）。

### 4. アラートシステム（`app/services/alert-checker.server.ts` — 63行）
商品別の`AlertConfig`を優先し、なければデフォルト（`productId = null`）にフォールバック。在庫が閾値以下、または`alertOnZero`有効時の在庫切れでアラートをトリガー。直近60分以内に同一バリアントへの通知がある場合はスロットリングでスキップ。`AlertLog`に全アラート履歴を記録。

### 5. Slack通知（`app/services/slack-notifier.server.ts` — 36行）
在庫切れ時は `:x: *在庫切れアラート*`、低在庫時は `:warning: *低在庫アラート*` の絵文字付きメッセージをSlack Incoming Webhookに送信。ショップ名、商品ID、バリアントID、現在在庫数、閾値を含むフォーマット。

### 6. アラート設定画面（`app/routes/app.alerts.tsx` — 108行）
全商品共通のデフォルト閾値と、商品別の個別閾値を`AlertConfigForm`コンポーネントで設定。閾値（数値）、在庫切れ通知の有効/無効、Slack Webhook URL、アラート有効/無効の4項目を設定可能。Remixの`useFetcher`によるupsert処理。

### 7. 商品別在庫詳細（`app/routes/app.products.$id.tsx` — 131行）
バリアント単位の在庫をIndexTableで表示（バリアントID / InventoryItem ID / 在庫数）。在庫数に応じてバッジ表示（在庫切れ: critical赤 / 低在庫: warning黄 / 正常: テキスト）。商品個別の在庫推移グラフを表示。

### 8. 在庫推移グラフ（`app/components/StockChart.tsx` — 72行）
Rechartsの`LineChart`で在庫推移を可視化。X軸: 日付（MM/DD形式）、Y軸: 在庫数。monotoneカーブ、青色（#2c6ecb）のライン。`ResponsiveContainer`でレスポンシブ対応。データなし時はメッセージを表示。

### 9. 日英切替（`app/i18n/` — 3ファイル）
React Context + `useTranslation()` フックによるクライアントサイドi18n。`localStorage`（キー: `stock-pulse-locale`）でロケール永続化（デフォルト: 日本語）。60キーの翻訳ファイル（en.json / ja.json）でダッシュボード・アラート・商品詳細等の全テキストをカバー。`{{paramKey}}`形式のパラメータ補間対応。

---

## データベース設計

```
┌─────────────────────────────┐
│         Session             │
├─────────────────────────────┤
│ id          STRING PK       │
│ shop        STRING          │
│ state       STRING          │
│ isOnline    BOOLEAN         │
│ scope       STRING?         │
│ expires     DATETIME?       │
│ accessToken STRING          │
│ userId      BIGINT?         │
│ firstName   STRING?         │
│ lastName    STRING?         │
│ email       STRING?         │
│ accountOwner BOOLEAN        │
│ locale      STRING?         │
│ collaborator BOOLEAN?       │
│ emailVerified BOOLEAN?      │
│ refreshToken STRING?        │
│ refreshTokenExpires DATETIME│
└─────────────────────────────┘

┌─────────────────────────────────┐
│       InventorySnapshot         │
├─────────────────────────────────┤
│ id              STRING PK       │
│ shop            STRING          │
│ productId       STRING          │
│ variantId       STRING          │
│ inventoryItemId STRING          │
│ quantity        INT             │
│ snapshotDate    DATETIME        │
│                                 │
│ @@index([shop, productId,       │
│          snapshotDate])         │
└─────────────────────────────────┘

┌─────────────────────────────┐      ┌─────────────────────────┐
│       AlertConfig           │      │       AlertLog          │
├─────────────────────────────┤      ├─────────────────────────┤
│ id              STRING PK   │      │ id        STRING PK     │
│ shop            STRING      │      │ shop      STRING        │
│ productId       STRING?     │      │ productId STRING        │
│  (null=全商品共通)          │      │ variantId STRING        │
│ threshold       INT (=10)   │      │ quantity  INT           │
│ alertOnZero     BOOLEAN     │      │ threshold INT           │
│ slackWebhookUrl STRING?     │      │ sentAt    DATETIME      │
│ isActive        BOOLEAN     │      └─────────────────────────┘
│                             │
│ @@unique([shop, productId]) │
└─────────────────────────────┘

インデックス: InventorySnapshot に (shop, productId, snapshotDate) の複合インデックス
ユニーク制約: AlertConfig に (shop, productId) のユニーク制約
```

---

## 画面仕様

### ダッシュボード（`/app`）
- サマリカード4枚: 総商品数 / 在庫切れ（critical赤）/ 低在庫（caution黄）/ 在庫総数
- レスポンシブグリッド（モバイル1列 / タブレット2列 / デスクトップ4列）
- 在庫推移グラフ（直近30日の折れ線チャート）
- 低在庫商品テーブル（閾値以下の商品一覧）
- 「在庫同期」ボタン + 成功バナー
- 言語切替ボタン

### アラート設定（`/app/alerts`）
- デフォルトアラート設定カード（全商品共通）
- 商品別アラート設定カード（個別閾値）
- 各カードの設定項目: 閾値（数値）/ 在庫切れ通知（チェックボックス）/ Slack Webhook URL / アラート有効/無効

### 商品別詳細（`/app/products/:id`）
- バリアント一覧テーブル（IndexTable）: バリアントID / InventoryItem ID / 在庫数（バッジ表示）
- 商品個別の在庫推移グラフ

---

## APIエンドポイント

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/app` | Shopify Admin | ダッシュボード（サマリ・推移・低在庫取得） |
| POST | `/app` | Shopify Admin | 在庫全同期の実行 |
| GET | `/app/alerts` | Shopify Admin | アラート設定フォーム表示 |
| POST | `/app/alerts` | Shopify Admin | アラート設定の保存（upsert） |
| GET | `/app/products/:id` | Shopify Admin | 商品別在庫詳細 + 推移データ |
| POST | `/webhooks/inventory-levels-update` | Shopify署名 | 在庫変動Webhook受信 |
| POST | `/webhooks/app/uninstalled` | Shopify署名 | アプリアンインストールWebhook |
| POST | `/webhooks/app/scopes_update` | Shopify署名 | スコープ更新Webhook |

---

## プロジェクト構成

```
stock-pulse/                              60ファイル（node_modules/build除く）
├── app/                                  TypeScript/TSX 26ファイル (1,503行)
│   ├── routes/
│   │   ├── app.tsx                 40行  レイアウトラッパー（認証・AppBridge初期化）
│   │   ├── app._index.tsx         100行  ダッシュボード（サマリ・グラフ・低在庫一覧）
│   │   ├── app.alerts.tsx         108行  アラート設定（デフォルト + 商品別）
│   │   ├── app.products.$id.tsx   131行  商品別在庫詳細 + 推移グラフ
│   │   ├── webhooks.inventory-levels-update.tsx  55行  在庫変動Webhook
│   │   ├── auth.login/
│   │   │   ├── route.tsx           79行  ログインフォーム
│   │   │   └── error.server.tsx    16行  ログインエラー処理
│   │   ├── auth.$.tsx               8行  OAuthコールバック
│   │   ├── webhooks.app.uninstalled.tsx    17行  アンインストールWebhook
│   │   └── webhooks.app.scopes_update.tsx  21行  スコープ更新Webhook
│   ├── services/
│   │   ├── inventory-sync.server.ts  239行  在庫データ取得・集計・同期
│   │   ├── alert-checker.server.ts    63行  閾値チェック・通知判定
│   │   └── slack-notifier.server.ts   36行  Slackアラート送信
│   ├── components/
│   │   ├── InventoryDashboard.tsx   68行  サマリカード4枚（グリッドレイアウト）
│   │   ├── StockChart.tsx           72行  在庫推移折れ線グラフ（Recharts）
│   │   ├── AlertConfigForm.tsx     102行  アラート設定フォーム
│   │   ├── ProductStockTable.tsx    93行  低在庫商品テーブル（バッジ付き）
│   │   ├── AppNavMenu.tsx           16行  ナビゲーションメニュー
│   │   └── LanguageToggle.tsx       17行  言語切替ボタン
│   ├── i18n/
│   │   ├── i18nContext.tsx          79行  i18n Provider + フック
│   │   ├── en.json                  60行  英語翻訳（60キー）
│   │   └── ja.json                  60行  日本語翻訳（60キー）
│   ├── shopify.server.ts            35行  Shopifyアプリ設定
│   ├── db.server.ts                 15行  Prismaクライアント初期化
│   ├── root.tsx                     30行  HTMLドキュメントルート
│   └── entry.server.tsx             59行  SSRハンドラー（ストリーミング対応）
├── prisma/
│   ├── schema.prisma                68行  データベーススキーマ（4モデル）
│   └── migrations/                       マイグレーション（2件）
├── package.json                     80行  依存関係定義
├── vite.config.ts                   74行  Viteビルド設定
├── tsconfig.json                    21行  TypeScript設定
├── shopify.app.toml                 33行  Shopifyアプリ設定（Webhook定義含む）
├── shopify.web.toml                  8行  Web設定
├── Dockerfile                       22行  本番デプロイ用（node:18-alpine）
└── CLAUDE.md                       138行  プロジェクト仕様
```

---

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) >=20.19 <22 または >=22.12
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- Shopify開発ストア
- Slackワークスペース + Incoming Webhook URL

### 手順

```bash
# リポジトリのクローン
git clone https://github.com/mer-prog/stock-pulse.git
cd stock-pulse

# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma migrate dev

# 開発サーバーの起動
shopify app dev

# 本番デプロイ
shopify app deploy
```

### 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `SHOPIFY_API_KEY` | ShopifyアプリのAPIキー（Partner Dashboardから取得） | はい |
| `SHOPIFY_API_SECRET` | Shopifyアプリのシークレットキー | はい |
| `SHOPIFY_APP_URL` | アプリの公開HTTPS URL | はい |
| `SCOPES` | APIスコープ（`read_products,read_inventory`） | はい |
| `PORT` | サーバーポート（デフォルト: 3000） | いいえ |
| `FRONTEND_PORT` | HMRポート（デフォルト: 8002） | いいえ |

---

## セキュリティ設計

| 対策 | 実装内容 |
|------|----------|
| APIスコープ最小化 | `read_products`, `read_inventory` の読み取り専用スコープのみ要求 |
| Webhook署名検証 | Shopifyライブラリが全Webhookリクエストの署名を自動検証（`authenticate.webhook()`） |
| セッション管理 | Prismaベースのセッションストレージ。有効期限付きアクセストークン + リフレッシュトークンローテーション対応 |
| アラートスロットリング | 同一バリアントへの通知を60分間隔に制限。`AlertLog`のsentAtで判定 |
| マルチテナント分離 | 全クエリに`shop`フィールドでのフィルタリングを適用。ショップ間のデータアクセスを防止 |

---

## 設計判断の根拠

| 判断 | 根拠 |
|------|------|
| Webhookベースのリアルタイム更新 | Shopifyの`inventory_levels/update` Webhookにより、ポーリング不要で在庫変動を即時検知。APIコール数を最小化 |
| InventorySnapshot方式の時系列保存 | 在庫変動のたびにスナップショットを記録することで、推移グラフの描画と履歴追跡が可能。上書きではなく追記型 |
| 全商品デフォルト + 商品別オーバーライド | AlertConfigの`productId = null`でデフォルト閾値を定義。商品固有の閾値を設定可能にし、運用の柔軟性を確保 |
| 60分のアラートスロットリング | 在庫の頻繁な変動（入出荷のたび）でSlack通知が大量に発生することを防止。実用的な通知頻度を維持 |
| Rechartsの採用 | React向け軽量チャートライブラリ。Polaris内に自然に統合でき、`ResponsiveContainer`でモバイル対応が容易 |
| SQLite + Prisma | MVP段階で十分な性能。スナップショットの追記型アクセスパターンに適合。本番移行時はPrismaのアダプタ変更のみ |
| サービス層の3ファイル分離 | inventory-sync / alert-checker / slack-notifier を独立させることで、テスト容易性と通知チャネル追加時の拡張性を確保 |
| 複合インデックス `[shop, productId, snapshotDate]` | 時系列クエリ（特定ショップの特定商品の在庫推移取得）を高速化。ダッシュボードの描画速度に直結 |

---

## 運用コスト

| サービス | プラン | 月額 |
|----------|--------|------|
| Shopify | 開発ストア（Dev Store） | 無料 |
| Slack Incoming Webhooks | 無料 | $0 |
| Recharts | OSS（無料） | $0 |
| ホスティング（Docker） | 要選定（Heroku / AWS / Fly.io等） | 環境依存 |
| **合計（開発環境）** | | **$0** |

---

## 作者

[@mer-prog](https://github.com/mer-prog)
