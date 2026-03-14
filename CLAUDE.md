# StockPulse — 在庫アラート＆分析ダッシュボード

## プロジェクト概要

Upworkポートフォリオ用のShopify Embedded App。
在庫が閾値を下回ったら即Slack通知。在庫推移の可視化で仕入れ判断をサポート。

**ターゲット:** 全マーチャント
**Dev Store:** ryo-dev-plus（Shopify Plus Dev Store）

## 技術スタック

- Remix（Shopify App Template）
- TypeScript
- Prisma + SQLite
- Polaris React
- GraphQL Admin API
- Shopify App Bridge
- Recharts（在庫推移グラフ）
- Slack Incoming Webhook

## 必要なAPIスコープ

read_products, read_inventory

## ディレクトリ構成

stock-pulse/
├── CLAUDE.md
├── app/
│   ├── routes/
│   │   ├── app._index.tsx           # ダッシュボード（在庫サマリ）
│   │   ├── app.alerts.tsx           # アラート設定
│   │   ├── app.products.$id.tsx     # 商品別在庫詳細
│   │   └── webhooks.tsx             # inventory_levels/update webhook
│   ├── services/
│   │   ├── inventory-sync.server.ts  # 在庫データ取得＆保存
│   │   ├── alert-checker.server.ts   # 閾値チェック＆通知判定
│   │   └── slack-notifier.server.ts  # Slack通知送信
│   ├── components/
│   │   ├── InventoryDashboard.tsx    # 在庫サマリカード群
│   │   ├── StockChart.tsx            # 在庫推移グラフ（Recharts）
│   │   ├── AlertConfigForm.tsx       # アラート設定フォーム
│   │   └── ProductStockTable.tsx     # 商品×バリアント在庫テーブル
│   └── shopify.server.ts
├── prisma/
│   └── schema.prisma
├── shopify.app.toml
└── package.json

## 画面構成

### ダッシュボード（app._index.tsx）
- サマリカード: 総商品数 / 在庫切れ商品数 / 低在庫商品数 / 在庫総数
- 低在庫商品リスト（閾値以下の商品を赤色ハイライト）
- 在庫推移グラフ（直近30日、全体の在庫量の折れ線）

### アラート設定（app.alerts.tsx）
- デフォルト閾値（全商品共通）
- 商品別の個別閾値設定
- 通知先（Slack Webhook URL）
- 通知条件（在庫が閾値以下 / 在庫切れ）

### 商品詳細（app.products.$id.tsx）
- バリアント別の在庫数表示
- 在庫推移グラフ（この商品のみ）

## 在庫データの取得・保存

初回: GraphQL inventoryItems queryで全在庫取得 -> Prismaに保存
以降: Webhook（inventory_levels/update）で差分更新
      + 1日1回の全同期（整合性担保）

## Prismaスキーマ（追加分）

model InventorySnapshot {
  id              String   @id @default(cuid())
  shop            String
  productId       String
  variantId       String
  inventoryItemId String
  quantity        Int
  snapshotDate    DateTime @default(now())
  @@index([shop, productId, snapshotDate])
}

model AlertConfig {
  id              String   @id @default(cuid())
  shop            String
  productId       String?  // nullなら全商品共通
  threshold       Int      @default(10)
  alertOnZero     Boolean  @default(true)
  slackWebhookUrl String?
  isActive        Boolean  @default(true)
  @@unique([shop, productId])
}

model AlertLog {
  id          String   @id @default(cuid())
  shop        String
  productId   String
  variantId   String
  quantity    Int
  threshold   Int
  sentAt      DateTime @default(now())
}

## コーディング規約

- TypeScript strict mode
- Polaris Reactコンポーネント使用
- Rechartsは在庫推移グラフのみ使用
- サービスロジックは *.server.ts に分離
- Conventional Commits形式

## MVPスコープ

含む:
- 在庫サマリダッシュボード
- 在庫推移グラフ（Recharts）
- 閾値設定 -> Slack通知
- Webhook受信で在庫リアルタイム更新

含まない（来週以降）:
- ABC分析
- メール通知
- 在庫予測（需要予測）

## コスト

- Slack Webhook: 無料
- Recharts: 無料（OSS）

## 開発コマンド

shopify app dev
shopify app deploy
