import {
  IndexTable,
  LegacyCard,
  Text,
  Badge,
  useIndexResourceState,
  Link,
} from "@shopify/polaris";
import { useTranslation } from "../i18n/i18nContext";

interface StockItem {
  productId: string;
  variantId: string;
  quantity: number;
  threshold: number;
}

export function ProductStockTable({ items }: { items: StockItem[] }) {
  const { t } = useTranslation();

  const resourceName = {
    singular: t("productStockTable.resourceSingular"),
    plural: t("productStockTable.resourcePlural"),
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(items.map((item, i) => ({ ...item, id: String(i) })));

  const rowMarkup = items.map((item, index) => {
    const productGid = item.productId;
    const numericId = productGid.split("/").pop();

    return (
      <IndexTable.Row
        id={String(index)}
        key={index}
        selected={selectedResources.includes(String(index))}
        position={index}
      >
        <IndexTable.Cell>
          <Link url={`/app/products/${numericId}`} removeUnderline>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {productGid}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {item.variantId}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {item.quantity === 0 ? (
            <Badge tone="critical">0</Badge>
          ) : item.quantity <= item.threshold ? (
            <Badge tone="warning">{String(item.quantity)}</Badge>
          ) : (
            <Text as="span" variant="bodyMd">
              {item.quantity}
            </Text>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {item.threshold}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <LegacyCard>
      <IndexTable
        resourceName={resourceName}
        itemCount={items.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: t("productStockTable.headingProductId") },
          { title: t("productStockTable.headingVariantId") },
          { title: t("productStockTable.headingQuantity") },
          { title: t("productStockTable.headingThreshold") },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}
