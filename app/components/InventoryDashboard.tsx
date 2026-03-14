import { Layout, LegacyCard, Text, InlineGrid, Box, BlockStack } from "@shopify/polaris";

interface SummaryData {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalQuantity: number;
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: "critical" | "caution" | "success";
}) {
  return (
    <LegacyCard sectioned>
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" tone="subdued">
          {title}
        </Text>
        <Text
          as="p"
          variant="headingXl"
          fontWeight="bold"
          tone={tone}
        >
          {value.toLocaleString()}
        </Text>
      </BlockStack>
    </LegacyCard>
  );
}

export function InventoryDashboard({ summary }: { summary: SummaryData }) {
  return (
    <Layout.Section>
      <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
        <Box>
          <SummaryCard title="総商品数" value={summary.totalProducts} />
        </Box>
        <Box>
          <SummaryCard
            title="在庫切れ商品数"
            value={summary.outOfStockCount}
            tone="critical"
          />
        </Box>
        <Box>
          <SummaryCard
            title="低在庫商品数"
            value={summary.lowStockCount}
            tone="caution"
          />
        </Box>
        <Box>
          <SummaryCard title="在庫総数" value={summary.totalQuantity} />
        </Box>
      </InlineGrid>
    </Layout.Section>
  );
}
