export interface ManagerSettings {
  autoApproveOrders: boolean;
  storefrontUrl: string;
  currency: string;
  stripeSecretKeyConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPasswordConfigured: boolean;
  smtpFromName: string;
  smtpFromEmail: string;
  updatedAt?: string;
}

export interface UpdateManagerSettingsPayload {
  autoApproveOrders?: boolean;
  storefrontUrl?: string;
  currency?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  clearStripeSecretKey?: boolean;
  clearStripeWebhookSecret?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  clearSmtpPassword?: boolean;
  smtpFromName?: string;
  smtpFromEmail?: string;
}
