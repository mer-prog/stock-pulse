import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, BlockStack, LegacyCard, IndexTable, Text, Badge } from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getInventoryHistory } from "../services/inventory-sync.server";
import { StockChart } from "../components/StockChart";
import { useTranslation } from "../i18n/i18nContext";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const productGid = `gid://shopify/Product/${params.id}`;

  const latestSnapshots = await db.$queryRaw<
    Array<{
      variantId: string;
      inventoryItemId: string;
      quantity: number;
      snapshotDate: string;
    }>
  >`
    SELECT s1.variantId, s1.inventoryItemId, s1.quantity, s1.snapshotDate
    FROM InventorySnapshot s1
    INNER JOIN (
      SELECT variantId, MAX(snapshotDate) as maxDate
      FROM InventorySnapshot
      WHERE shop = ${shop} AND productId = ${productGid}
      GROUP BY variantId
    ) s2 ON s1.variantId = s2.variantId AND s1.snapshotDate = s2.maxDate
    WHERE s1.shop = ${shop} AND s1.productId = ${productGid}
  `;

  const history = await getInventoryHistory(shop, 30, productGid);

  const alertConfig = await db.alertConfig.findFirst({
    where: { shop, productId: productGid },
  });
  const defaultConfig = await db.alertConfig.findFirst({
    where: { shop, productId: null },
  });
  const threshold = alertConfig?.threshold ?? defaultConfig?.threshold ?? 10;

  return json({
    productId: params.id,
    productGid,
    variants: latestSnapshots.map((s) => ({
      variantId: s.variantId,
      inventoryItemId: s.inventoryItemId,
      quantity: s.quantity,
    })),
    history,
    threshold,
  });
};

export default function ProductDetail() {
  const { productId, variants, history, threshold } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <Page
      title={t("productDetail.title", { id: productId ?? "" })}
      backAction={{ url: "/app" }}
    >
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <LegacyCard>
              <IndexTable
                resourceName={{
                  singular: t("productDetail.variantResourceSingular"),
                  plural: t("productDetail.variantResourcePlural"),
                }}
                itemCount={variants.length}
                headings={[
                  { title: t("productDetail.headingVariantId") },
                  { title: t("productDetail.headingInventoryItemId") },
                  { title: t("productDetail.headingQuantity") },
                ]}
                selectable={false}
              >
                {variants.map((variant, index) => (
                  <IndexTable.Row
                    id={variant.variantId}
                    key={variant.variantId}
                    position={index}
                  >
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        {variant.variantId}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodyMd">
                        {variant.inventoryItemId}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {variant.quantity === 0 ? (
                        <Badge tone="critical">0</Badge>
                      ) : variant.quantity <= threshold ? (
                        <Badge tone="warning">{String(variant.quantity)}</Badge>
                      ) : (
                        <Text as="span" variant="bodyMd">
                          {variant.quantity}
                        </Text>
                      )}
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </LegacyCard>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <StockChart
              data={history}
              title={t("productDetail.stockChartTitle", { id: productId ?? "" })}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
