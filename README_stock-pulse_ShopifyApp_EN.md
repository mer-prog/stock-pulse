# StockPulse — Real-Time Inventory Alerts & Analytics Dashboard

> **What:** A Shopify Embedded App that monitors inventory levels, sends instant Slack alerts when stock drops below thresholds, and visualizes inventory trends
> **Who:** All Shopify merchants seeking efficient inventory management
> **Tech:** Remix · TypeScript · Prisma + SQLite · Polaris React · Recharts · Shopify GraphQL Admin API · Slack Incoming Webhooks

**Source Code:** [github.com/mer-prog/stock-pulse](https://github.com/mer-prog/stock-pulse)

---

## Skills Demonstrated

| Skill | Implementation |
|-------|---------------|
| Shopify App Development | Embedded App built on the official Shopify App Template (Remix) with OAuth, `inventory_levels/update` webhook handling, and GraphQL Admin API inventory fetching |
| Real-Time Data Processing | Shopify webhook-driven inventory change detection with automatic threshold checks, Slack notifications, and 60-minute throttling to prevent duplicate alerts |
| Data Visualization | Recharts line charts for inventory trends — both global 30-day overview and per-product breakdown |
| Database Design | Prisma ORM with 4 models (Session, InventorySnapshot, AlertConfig, AlertLog), composite index for time-series queries, and unique constraint for per-product thresholds |
| Alert System Architecture | Default global thresholds with per-product overrides using a fallback pattern; two-tier alerts for out-of-stock and low-stock conditions |
| Full-Stack Implementation | Unified front-end and back-end via Remix loader/action pattern with a cleanly separated service layer (inventory sync, alert checker, Slack notifier) |
| Internationalization (i18n) | Client-side React Context + localStorage locale switching (EN/JA) with 60 translation keys and parameter interpolation |

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Remix (Shopify App Template) | ^2.16.1 | SSR, file-based routing, loader/action pattern |
| Language | TypeScript | ^5.2.2 | Type-safe development (strict mode enabled) |
| UI Library | Polaris React | ^12.0.0 | Shopify admin-consistent UI components |
| Charts | Recharts | ^3.8.0 | Inventory trend line charts |
| Database | Prisma + SQLite | ^6.2.1 | ORM, migration management, session storage |
| API | Shopify GraphQL Admin API | 2025-01 | Bulk inventory data retrieval (inventoryItems query) |
| Auth | Shopify App Bridge React | ^4.1.6 | Embedded app authentication, OAuth flow |
| Session Storage | shopify-app-session-storage-prisma | ^8.0.0 | Prisma-backed session persistence |
| Notifications | Slack Incoming Webhooks | — | Instant inventory alert delivery |
| Build Tool | Vite | ^6.2.2 | HMR, production builds |
| Runtime | Node.js | >=20.19 <22 \|\| >=22.12 | Server execution environment |
| Code Quality | ESLint + Prettier | ^8.42.0 / ^3.2.4 | Linting and formatting |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Shopify Admin (Embedded App)                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Polaris React UI                         │  │
│  │  Dashboard      │ Alert Settings │ Product Detail          │  │
│  │  (Summary cards)  (Thresholds)     (Variant inventory)     │  │
│  │  (Trend chart)    (Slack URL)      (Per-product chart)     │  │
│  │  (Low stock list)                                          │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          │ Remix loader / action                  │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │                     Remix Server                            │  │
│  │  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐   │  │
│  │  │ inventory-    │ │ alert-       │ │ slack-          │   │  │
│  │  │ sync          │ │ checker      │ │ notifier        │   │  │
│  │  │ .server.ts    │ │ .server.ts   │ │ .server.ts      │   │  │
│  │  │ (239 lines)   │ │ (63 lines)   │ │ (36 lines)      │   │  │
│  │  └──────┬────────┘ └──────┬───────┘ └────────┬────────┘   │  │
│  │         │                 │                   │            │  │
│  └─────────┼─────────────────┼───────────────────┼────────────┘  │
│            │                 │                   │               │
└────────────┼─────────────────┼───────────────────┼───────────────┘
             │                 │                   │
     ┌───────▼───────┐        │           ┌───────▼───────┐
     │ Shopify       │        │           │ Slack         │
     │ GraphQL API   │        │           │ Webhook API   │
     │ (Inventory)   │        │           │ (Alerts)      │
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
             │ Create InventorySnapshot       │
             │        │                       │
             │        ▼                       │
             │ alert-checker (threshold eval) │
             │        │                       │
             │        ▼                       │
             │ slack-notifier (send alert)    │
             └────────────────────────────────┘
```

---

## Key Features

### 1. Inventory Dashboard (`app/routes/app._index.tsx` — 100 lines)
Displays four summary cards (Total Products / Out of Stock / Low Stock / Total Quantity) in a responsive grid. Renders a 30-day inventory trend line chart via the `StockChart` component. Lists all products below their threshold in a `ProductStockTable`. A "Sync Inventory" button triggers a full inventory sync on demand.

### 2. Inventory Sync Engine (`app/services/inventory-sync.server.ts` — 239 lines)
Fetches all inventory via the Shopify GraphQL Admin API's `inventoryItems` query with pagination (50 items per page). Maps each InventoryItem to its variant and product IDs, sums available quantities across all locations, and persists each as an `InventorySnapshot` in Prisma. Provides four query functions: `getInventorySummary()` (aggregate metrics), `getInventoryHistory()` (time-series data), `getLowStockProducts()` (threshold-filtered products), and `syncAllInventory()` (full sync).

### 3. Webhook Real-Time Updates (`app/routes/webhooks.inventory-levels-update.tsx` — 55 lines)
Receives Shopify's `inventory_levels/update` webhook. Looks up the corresponding product and variant IDs from existing snapshots, creates a new `InventorySnapshot` with the updated quantity, then calls `checkAndAlert()` for automatic threshold evaluation. Skips unsynced inventory items (requires initial full sync).

### 4. Alert System (`app/services/alert-checker.server.ts` — 63 lines)
Looks up a product-specific `AlertConfig` first, then falls back to the default config (`productId = null`). Triggers an alert when inventory drops to or below the threshold, or when `alertOnZero` is enabled and stock hits zero. Checks the `AlertLog` for recent notifications within a 60-minute window to prevent duplicate alerts. Records every triggered alert in the log.

### 5. Slack Notifications (`app/services/slack-notifier.server.ts` — 36 lines)
Sends emoji-formatted messages to Slack via Incoming Webhooks: `:x: Out of Stock Alert` for zero inventory, `:warning: Low Stock Alert` otherwise. Messages include shop name, product ID, variant ID, current quantity, and threshold.

### 6. Alert Configuration (`app/routes/app.alerts.tsx` — 108 lines)
Provides forms for both the global default threshold and per-product overrides using the `AlertConfigForm` component. Each form includes threshold (number), out-of-stock notification toggle, Slack webhook URL, and alert enable/disable. Uses Remix `useFetcher` for upsert operations.

### 7. Product Detail View (`app/routes/app.products.$id.tsx` — 131 lines)
Displays variant-level inventory in an IndexTable (Variant ID / InventoryItem ID / Quantity). Quantities are badge-coded: critical (red) for zero, warning (yellow) for low stock, plain text for healthy. Includes a product-specific inventory trend chart.

### 8. Stock Trend Charts (`app/components/StockChart.tsx` — 72 lines)
Recharts `LineChart` with responsive container for inventory trend visualization. X-axis shows dates in MM/DD format, Y-axis shows quantities. Monotone curve with blue (#2c6ecb) stroke. Displays a "no data" message when the dataset is empty.

### 9. Language Switching (`app/i18n/` — 3 files)
Client-side i18n via React Context with a `useTranslation()` hook. Locale is persisted in `localStorage` (key: `stock-pulse-locale`, default: Japanese). 60 translation keys across en.json and ja.json cover dashboard, alerts, product detail, and all UI text. Supports `{{paramKey}}` parameter interpolation.

---

## Database Design

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
│  (null = all products)      │      │ variantId STRING        │
│ threshold       INT (=10)   │      │ quantity  INT           │
│ alertOnZero     BOOLEAN     │      │ threshold INT           │
│ slackWebhookUrl STRING?     │      │ sentAt    DATETIME      │
│ isActive        BOOLEAN     │      └─────────────────────────┘
│                             │
│ @@unique([shop, productId]) │
└─────────────────────────────┘

Index: Composite (shop, productId, snapshotDate) on InventorySnapshot
Unique: (shop, productId) on AlertConfig
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/app` | Shopify Admin | Dashboard — summary, trend data, low-stock list |
| POST | `/app` | Shopify Admin | Trigger full inventory sync |
| GET | `/app/alerts` | Shopify Admin | Alert configuration forms |
| POST | `/app/alerts` | Shopify Admin | Save alert settings (upsert) |
| GET | `/app/products/:id` | Shopify Admin | Product inventory detail + trend data |
| POST | `/webhooks/inventory-levels-update` | Shopify signature | Inventory level change webhook |
| POST | `/webhooks/app/uninstalled` | Shopify signature | App uninstall webhook |
| POST | `/webhooks/app/scopes_update` | Shopify signature | Scope update webhook |

---

## Screen Specifications

### Dashboard (`/app`)
- Four summary cards: Total Products / Out of Stock (critical, red) / Low Stock (caution, yellow) / Total Quantity
- Responsive grid (mobile: 1 col / tablet: 2 cols / desktop: 4 cols)
- 30-day inventory trend line chart
- Low-stock product table (items below threshold)
- "Sync Inventory" button with success banner
- Language toggle button

### Alert Settings (`/app/alerts`)
- Default alert config card (applies to all products)
- Product-specific alert config cards (individual overrides)
- Form fields per card: threshold (number) / out-of-stock notification (checkbox) / Slack Webhook URL / alert enable/disable

### Product Detail (`/app/products/:id`)
- Variant inventory table (IndexTable): Variant ID / InventoryItem ID / Quantity (with badge)
- Product-specific inventory trend chart

---

## Project Structure

```
stock-pulse/                              60 files (excluding node_modules/build)
├── app/                                  TypeScript/TSX: 26 files (1,503 lines)
│   ├── routes/
│   │   ├── app.tsx                 40 lines  Layout wrapper (auth, AppBridge init)
│   │   ├── app._index.tsx         100 lines  Dashboard (summary, chart, low-stock)
│   │   ├── app.alerts.tsx         108 lines  Alert configuration (default + per-product)
│   │   ├── app.products.$id.tsx   131 lines  Product inventory detail + trend chart
│   │   ├── webhooks.inventory-levels-update.tsx  55 lines  Inventory webhook
│   │   ├── auth.login/
│   │   │   ├── route.tsx           79 lines  Login form
│   │   │   └── error.server.tsx    16 lines  Login error handling
│   │   ├── auth.$.tsx               8 lines  OAuth callback
│   │   ├── webhooks.app.uninstalled.tsx    17 lines  Uninstall webhook
│   │   └── webhooks.app.scopes_update.tsx  21 lines  Scope update webhook
│   ├── services/
│   │   ├── inventory-sync.server.ts  239 lines  Inventory fetch, aggregation, sync
│   │   ├── alert-checker.server.ts    63 lines  Threshold evaluation, notification logic
│   │   └── slack-notifier.server.ts   36 lines  Slack alert delivery
│   ├── components/
│   │   ├── InventoryDashboard.tsx   68 lines  Summary cards (4-card grid layout)
│   │   ├── StockChart.tsx           72 lines  Inventory trend line chart (Recharts)
│   │   ├── AlertConfigForm.tsx     102 lines  Alert settings form
│   │   ├── ProductStockTable.tsx    93 lines  Low-stock product table (with badges)
│   │   ├── AppNavMenu.tsx           16 lines  Navigation menu
│   │   └── LanguageToggle.tsx       17 lines  Language toggle button
│   ├── i18n/
│   │   ├── i18nContext.tsx          79 lines  i18n Context Provider + hooks
│   │   ├── en.json                  60 lines  English translations (60 keys)
│   │   └── ja.json                  60 lines  Japanese translations (60 keys)
│   ├── shopify.server.ts            35 lines  Shopify app configuration
│   ├── db.server.ts                 15 lines  Prisma client initialization
│   ├── root.tsx                     30 lines  HTML document root
│   └── entry.server.tsx             59 lines  SSR handler (streaming)
├── prisma/
│   ├── schema.prisma                68 lines  Database schema (4 models)
│   └── migrations/                        Migrations (2 entries)
├── package.json                     80 lines  Dependency definitions
├── vite.config.ts                   74 lines  Vite build configuration
├── tsconfig.json                    21 lines  TypeScript configuration
├── shopify.app.toml                 33 lines  Shopify app config (webhook definitions)
├── shopify.web.toml                  8 lines  Web configuration
├── Dockerfile                       22 lines  Production deployment (node:18-alpine)
└── CLAUDE.md                       138 lines  Project specification
```

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >=20.19 <22 or >=22.12
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- A Shopify development store
- A Slack workspace with an Incoming Webhook URL

### Installation

```bash
# Clone the repository
git clone https://github.com/mer-prog/stock-pulse.git
cd stock-pulse

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start the development server
shopify app dev

# Deploy to production
shopify app deploy
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_API_KEY` | Shopify app API key (from Partner Dashboard) | Yes |
| `SHOPIFY_API_SECRET` | Shopify app secret key | Yes |
| `SHOPIFY_APP_URL` | Public HTTPS URL of the app | Yes |
| `SCOPES` | API scopes (`read_products,read_inventory`) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `FRONTEND_PORT` | HMR port (default: 8002) | No |

---

## Security Design

| Measure | Implementation |
|---------|---------------|
| Minimal API Scopes | Requests only read-only scopes: `read_products`, `read_inventory` |
| Webhook Signature Verification | Shopify library automatically validates all incoming webhook signatures via `authenticate.webhook()` |
| Session Management | Prisma-backed session storage with expiring access tokens and refresh token rotation |
| Alert Throttling | Limits notifications to one per variant per 60-minute window using `AlertLog.sentAt` timestamps |
| Multi-Tenant Isolation | All queries are filtered by `shop` field, preventing cross-store data access |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Webhook-based real-time updates | Shopify's `inventory_levels/update` webhook eliminates polling and provides instant change detection while minimizing API call volume |
| Append-only InventorySnapshot pattern | Recording a snapshot on every change enables trend chart rendering and historical tracking without overwriting data |
| Global default + per-product override | `AlertConfig` with `productId = null` defines a shop-wide default; product-specific entries override it, giving operators maximum flexibility |
| 60-minute alert throttling | Prevents notification floods during high-frequency inventory changes (e.g., receiving shipments) while maintaining practical alert cadence |
| Recharts for visualization | Lightweight React charting library that integrates naturally into Polaris layouts; `ResponsiveContainer` handles mobile responsiveness out of the box |
| SQLite + Prisma | Sufficient performance for MVP; the append-only snapshot access pattern is well-suited to SQLite, and Prisma makes switching to PostgreSQL a single adapter change |
| Three-file service layer split | Isolating inventory-sync, alert-checker, and slack-notifier makes each independently testable and simplifies adding new notification channels |
| Composite index `[shop, productId, snapshotDate]` | Optimizes the most frequent query pattern: fetching a specific shop's product inventory over a date range for chart rendering |

---

## Running Costs

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Shopify | Development Store | Free |
| Slack Incoming Webhooks | Free | $0 |
| Recharts | OSS (free) | $0 |
| Hosting (Docker) | Provider-dependent (Heroku / AWS / Fly.io) | Varies |
| **Total (development)** | | **$0** |

---

## Author

[@mer-prog](https://github.com/mer-prog)
