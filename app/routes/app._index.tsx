import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, BlockStack, Button, Banner, InlineStack } from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import {
  syncAllInventory,
  getInventorySummary,
  getInventoryHistory,
  getLowStockProducts,
} from "../services/inventory-sync.server";
import { InventoryDashboard } from "../components/InventoryDashboard";
import { StockChart } from "../components/StockChart";
import { ProductStockTable } from "../components/ProductStockTable";
import { LanguageToggle } from "../components/LanguageToggle";
import { useTranslation } from "../i18n/i18nContext";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [summary, history, lowStockItems] = await Promise.all([
    getInventorySummary(shop),
    getInventoryHistory(shop, 30),
    getLowStockProducts(shop),
  ]);

  return json({
    summary: {
      totalProducts: summary.totalProducts,
      outOfStockCount: summary.outOfStockCount,
      lowStockCount: summary.lowStockCount,
      totalQuantity: summary.totalQuantity,
    },
    history,
    lowStockItems,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const syncedCount = await syncAllInventory(admin, shop);

  return json({ success: true, syncedCount });
};

export default function Dashboard() {
  const { summary, history, lowStockItems } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation();

  const isSyncing = fetcher.state !== "idle";

  return (
    <Page title={t("dashboard.title")}>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <InlineStack align="space-between">
              <fetcher.Form method="post">
                <Button submit loading={isSyncing} variant="primary">
                  {t("dashboard.syncButton")}
                </Button>
              </fetcher.Form>
              <LanguageToggle />
            </InlineStack>
            {fetcher.data?.success && (
              <Banner tone="success">
                {t("dashboard.syncSuccess", {
                  count: fetcher.data.syncedCount,
                })}
              </Banner>
            )}
          </Layout.Section>
        </Layout>

        <Layout>
          <InventoryDashboard summary={summary} />
        </Layout>

        <Layout>
          <Layout.Section>
            <StockChart data={history} />
          </Layout.Section>
        </Layout>

        {lowStockItems.length > 0 && (
          <Layout>
            <Layout.Section>
              <ProductStockTable items={lowStockItems} />
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>
    </Page>
  );
}
