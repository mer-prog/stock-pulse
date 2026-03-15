import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Outlet,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { I18nProvider } from "../i18n/i18nContext";
import { AppNavMenu } from "../components/AppNavMenu";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <I18nProvider>
        <AppNavMenu />
        <Outlet />
      </I18nProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  const error = useRouteError();

  // boundary.error() only handles Remix ErrorResponse objects and
  // re-throws everything else, which would crash the app if root.tsx
  // has no ErrorBoundary.  Guard against that here.
  if (isRouteErrorResponse(error)) {
    return boundary.error(error);
  }

  return (
    <AppProvider isEmbeddedApp apiKey="">
      <div style={{ padding: "2rem" }}>
        <h1>Unexpected error</h1>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    </AppProvider>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
