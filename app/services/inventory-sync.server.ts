import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import db from "../db.server";

interface InventoryItemEdge {
  node: {
    id: string;
    inventoryLevels: {
      edges: Array<{
        node: {
          quantities: Array<{
            name: string;
            quantity: number;
          }>;
        };
      }>;
    };
    variant: {
      id: string;
      product: {
        id: string;
      };
    };
  };
}

const INVENTORY_ITEMS_QUERY = `#graphql
  query inventoryItems($first: Int!, $after: String) {
    inventoryItems(first: $first, after: $after) {
      edges {
        node {
          id
          inventoryLevels(first: 10) {
            edges {
              node {
                quantities(names: ["available"]) {
                  name
                  quantity
                }
              }
            }
          }
          variant {
            id
            product {
              id
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function syncAllInventory(
  admin: AdminApiContext,
  shop: string,
): Promise<number> {
  let hasNextPage = true;
  let cursor: string | null = null;
  let syncedCount = 0;
  const now = new Date();

  while (hasNextPage) {
    const response: Response = await admin.graphql(INVENTORY_ITEMS_QUERY, {
      variables: { first: 50, after: cursor },
    });

    const data: { data?: { inventoryItems?: { edges: InventoryItemEdge[]; pageInfo: { hasNextPage: boolean; endCursor: string } } } } = await response.json();
    const inventoryItems = data.data?.inventoryItems;
    if (!inventoryItems) break;

    const edges: InventoryItemEdge[] = inventoryItems.edges;

    for (const edge of edges) {
      const { node } = edge;
      if (!node.variant) continue;

      const totalQuantity = node.inventoryLevels.edges.reduce(
        (sum: number, level) => {
          const available = level.node.quantities.find(
            (q) => q.name === "available",
          );
          return sum + (available?.quantity ?? 0);
        },
        0,
      );

      await db.inventorySnapshot.create({
        data: {
          shop,
          productId: node.variant.product.id,
          variantId: node.variant.id,
          inventoryItemId: node.id,
          quantity: totalQuantity,
          snapshotDate: now,
        },
      });

      syncedCount++;
    }

    hasNextPage = inventoryItems.pageInfo.hasNextPage;
    cursor = inventoryItems.pageInfo.endCursor;
  }

  return syncedCount;
}

export async function getInventorySummary(shop: string) {
  const latestSnapshots = await db.$queryRaw<
    Array<{
      productId: string;
      variantId: string;
      quantity: number;
      snapshotDate: string;
    }>
  >`
    SELECT s1.productId, s1.variantId, s1.quantity, s1.snapshotDate
    FROM InventorySnapshot s1
    INNER JOIN (
      SELECT variantId, MAX(snapshotDate) as maxDate
      FROM InventorySnapshot
      WHERE shop = ${shop}
      GROUP BY variantId
    ) s2 ON s1.variantId = s2.variantId AND s1.snapshotDate = s2.maxDate
    WHERE s1.shop = ${shop}
  `;

  const uniqueProducts = new Set(latestSnapshots.map((s) => s.productId));
  const totalQuantity = latestSnapshots.reduce((sum, s) => sum + s.quantity, 0);
  const outOfStock = latestSnapshots.filter((s) => s.quantity === 0);
  const outOfStockProducts = new Set(outOfStock.map((s) => s.productId));

  const alertConfig = await db.alertConfig.findFirst({
    where: { shop, productId: null },
  });
  const defaultThreshold = alertConfig?.threshold ?? 10;

  const lowStock = latestSnapshots.filter(
    (s) => s.quantity > 0 && s.quantity <= defaultThreshold,
  );
  const lowStockProducts = new Set(lowStock.map((s) => s.productId));

  return {
    totalProducts: uniqueProducts.size,
    outOfStockCount: outOfStockProducts.size,
    lowStockCount: lowStockProducts.size,
    totalQuantity,
    defaultThreshold,
    latestSnapshots,
  };
}

export async function getInventoryHistory(
  shop: string,
  days: number = 30,
  productId?: string,
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: {
    shop: string;
    snapshotDate: { gte: Date };
    productId?: string;
  } = {
    shop,
    snapshotDate: { gte: since },
  };

  if (productId) {
    where.productId = productId;
  }

  const snapshots = await db.inventorySnapshot.findMany({
    where,
    orderBy: { snapshotDate: "asc" },
  });

  const grouped = new Map<string, { date: string; quantity: number }>();
  for (const snapshot of snapshots) {
    const dateKey = snapshot.snapshotDate.toISOString().split("T")[0];
    const existing = grouped.get(dateKey);
    if (existing) {
      existing.quantity += snapshot.quantity;
    } else {
      grouped.set(dateKey, { date: dateKey, quantity: snapshot.quantity });
    }
  }

  return Array.from(grouped.values());
}

export async function getLowStockProducts(shop: string) {
  const alertConfig = await db.alertConfig.findFirst({
    where: { shop, productId: null },
  });
  const defaultThreshold = alertConfig?.threshold ?? 10;

  const productConfigs = await db.alertConfig.findMany({
    where: { shop, productId: { not: null } },
  });
  const thresholdMap = new Map(
    productConfigs.map((c) => [c.productId!, c.threshold]),
  );

  const latestSnapshots = await db.$queryRaw<
    Array<{
      productId: string;
      variantId: string;
      inventoryItemId: string;
      quantity: number;
    }>
  >`
    SELECT s1.productId, s1.variantId, s1.inventoryItemId, s1.quantity
    FROM InventorySnapshot s1
    INNER JOIN (
      SELECT variantId, MAX(snapshotDate) as maxDate
      FROM InventorySnapshot
      WHERE shop = ${shop}
      GROUP BY variantId
    ) s2 ON s1.variantId = s2.variantId AND s1.snapshotDate = s2.maxDate
    WHERE s1.shop = ${shop}
  `;

  return latestSnapshots
    .filter((s) => {
      const threshold = thresholdMap.get(s.productId) ?? defaultThreshold;
      return s.quantity <= threshold;
    })
    .map((s) => ({
      ...s,
      threshold: thresholdMap.get(s.productId) ?? defaultThreshold,
    }));
}
