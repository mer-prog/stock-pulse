# StockPulse

**Real-time inventory alerts and analytics dashboard for Shopify stores.**

![StockPulse Screenshot](docs/screenshots/stock-pulse-preview.png)

## Features

- **Inventory Dashboard** — Summary cards showing total products, out-of-stock count, low-stock count, and total inventory
- **Stock Trend Charts** — 30-day inventory level graphs powered by Recharts
- **Threshold Alerts** — Configurable per-product or global low-stock thresholds with instant Slack notifications
- **Real-Time Updates** — Webhook-driven inventory sync via `inventory_levels/update` with daily full reconciliation
- **Per-Product Detail** — Variant-level inventory breakdown with individual trend charts
- **Alert History** — Complete log of all triggered alerts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Remix (Shopify App Template) |
| Language | TypeScript |
| Database | Prisma + SQLite |
| UI | Polaris React |
| Charts | Recharts |
| API | Shopify GraphQL Admin API |
| Notifications | Slack Incoming Webhooks |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- A Shopify development store
- A Slack workspace with an Incoming Webhook URL

### Setup

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start development server
shopify app dev
```

### Deployment

```bash
shopify app deploy
```

## Architecture

```
stock-pulse/
├── app/
│   ├── routes/          # Dashboard, alert config, product detail, webhooks
│   ├── services/        # Inventory sync, alert checker, Slack notifier
│   └── components/      # Dashboard cards, stock charts, alert forms, tables
├── prisma/              # Database schema (InventorySnapshot, AlertConfig, AlertLog)
└── shopify.app.toml     # Shopify app configuration
```

Initial inventory is fetched via the GraphQL Admin API and stored as daily snapshots. Subsequent updates arrive through Shopify webhooks for near-real-time accuracy, supplemented by a daily full sync for data integrity. When inventory drops below a configured threshold, the alert checker triggers a Slack notification.

## License

MIT
