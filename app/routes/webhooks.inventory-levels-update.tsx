import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { checkAndAlert } from "../services/alert-checker.server";

interface InventoryLevelPayload {
  inventory_item_id: number;
  location_id: number;
  available: number;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);
  const data = payload as unknown as InventoryLevelPayload;

  console.log(
    `Received inventory_levels/update webhook for ${shop}:`,
    JSON.stringify(data),
  );

  const inventoryItemGid = `gid://shopify/InventoryItem/${data.inventory_item_id}`;

  const existingSnapshot = await db.inventorySnapshot.findFirst({
    where: { shop, inventoryItemId: inventoryItemGid },
    orderBy: { snapshotDate: "desc" },
  });

  if (!existingSnapshot) {
    console.log(
      `No existing snapshot found for inventory item ${inventoryItemGid}, skipping. Run a full sync first.`,
    );
    return new Response();
  }

  const quantity = data.available ?? 0;

  await db.inventorySnapshot.create({
    data: {
      shop,
      productId: existingSnapshot.productId,
      variantId: existingSnapshot.variantId,
      inventoryItemId: inventoryItemGid,
      quantity,
    },
  });

  await checkAndAlert({
    shop,
    productId: existingSnapshot.productId,
    variantId: existingSnapshot.variantId,
    quantity,
  });

  return new Response();
};
