import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import { I18nProvider, useTranslation } from "../../i18n/i18nContext";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors, polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

function LoginForm() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;
  const { t } = useTranslation();

  return (
    <Page>
      <Card>
        <Form method="post">
          <FormLayout>
            <Text variant="headingMd" as="h2">
              {t("login.title")}
            </Text>
            <TextField
              type="text"
              name="shop"
              label={t("login.shopLabel")}
              helpText={t("login.shopHelpText")}
              value={shop}
              onChange={setShop}
              autoComplete="on"
              error={errors.shop}
            />
            <Button submit>{t("login.submit")}</Button>
          </FormLayout>
        </Form>
      </Card>
    </Page>
  );
}

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <I18nProvider>
        <LoginForm />
      </I18nProvider>
    </PolarisAppProvider>
  );
}
