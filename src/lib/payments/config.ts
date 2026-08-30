// Payment provider credentials. Both providers are optional: with the keys
// absent the site works exactly as before, only without a checkout button.

export const clickConfig = {
  merchantId: process.env.CLICK_MERCHANT_ID ?? "",
  serviceId: process.env.CLICK_SERVICE_ID ?? "",
  secretKey: process.env.CLICK_SECRET_KEY ?? "",
};

export const paymeConfig = {
  merchantId: process.env.PAYME_MERCHANT_ID ?? "",
  secretKey: process.env.PAYME_SECRET_KEY ?? "",
};

export const isClickConfigured = Boolean(
  clickConfig.merchantId && clickConfig.serviceId && clickConfig.secretKey
);

export const isPaymeConfigured = Boolean(paymeConfig.merchantId && paymeConfig.secretKey);

export const isAnyProviderConfigured = isClickConfigured || isPaymeConfigured;
