import { ConfidenceLevel, ProviderCategory } from "@repo/enums-common";

/** Which normalized record set a fingerprint's `patterns` are matched against. */
export type FingerprintSource = "ns" | "mxExchange" | "txt" | "spfInclude";

export interface ProviderFingerprint {
  vendor: string;
  category: ProviderCategory;
  source: FingerprintSource;
  /** Case-insensitive substrings; any match on any pattern counts as a hit. */
  patterns: string[];
  confidence: ConfidenceLevel;
}

/**
 * Data-driven provider fingerprints. Add a new vendor by appending an entry —
 * no code changes needed elsewhere. Substring matching is deliberately loose
 * (mirrors how these verification tokens/mail exchangers actually appear on the
 * wire); prefer HIGH confidence only for patterns that are effectively unique
 * to one vendor.
 */
export const PROVIDER_FINGERPRINTS: ProviderFingerprint[] = [
  // --- DNS providers (NS records) ---
  {
    vendor: "Cloudflare",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["cloudflare.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Cloudflare",
    category: ProviderCategory.CDN_PROXY,
    source: "ns",
    // NS-only signal: confirms Cloudflare is the DNS host, not necessarily that
    // traffic is proxied through it — kept at MEDIUM confidence for that reason.
    patterns: ["cloudflare.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "AWS Route 53",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["awsdns"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Google Cloud DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["googledomains.com", "google.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Azure DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["azure-dns.com", "azure-dns.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "GoDaddy",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["domaincontrol.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Namecheap",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["registrar-servers.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "DigitalOcean",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["digitalocean.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "NS1",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["nsone.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Akamai Edge DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["akam.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Vercel",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["vercel-dns.com"],
    confidence: ConfidenceLevel.HIGH,
  },

  // --- Email providers (MX records) ---
  {
    vendor: "Google Workspace",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["aspmx.l.google.com", "google.com", "googlemail.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Microsoft 365",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["outlook.com", "protection.outlook.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Zoho Mail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["zoho.com", "zoho.eu"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "ProtonMail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["protonmail.ch", "proton.me"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Fastmail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["fastmail.com", "messagingengine.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Mimecast",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["mimecast.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Proofpoint",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["pphosted.com", "proofpoint.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Amazon SES",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["amazonses.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },

  // --- TXT domain-verification tokens ---
  {
    vendor: "HubSpot",
    category: ProviderCategory.CRM,
    source: "txt",
    patterns: ["hubspot"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Salesforce",
    category: ProviderCategory.CRM,
    source: "txt",
    patterns: ["salesforce"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Microsoft Dynamics 365",
    category: ProviderCategory.CRM,
    source: "txt",
    patterns: ["d365mktkey="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Mailchimp",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "txt",
    patterns: ["mailchimp"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Klaviyo",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "txt",
    patterns: ["klaviyo"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "ActiveCampaign",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "txt",
    patterns: ["activecampaign"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Brevo (Sendinblue)",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "txt",
    patterns: ["sendinblue", "brevo"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Okta",
    category: ProviderCategory.SSO_IDP,
    source: "txt",
    patterns: ["okta-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Auth0",
    category: ProviderCategory.SSO_IDP,
    source: "txt",
    patterns: ["auth0-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "OneLogin",
    category: ProviderCategory.SSO_IDP,
    source: "txt",
    patterns: ["onelogin-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Duo Security",
    category: ProviderCategory.SSO_IDP,
    source: "txt",
    patterns: ["duo_sso_verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Google",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["google-site-verification"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Bing",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["msvalidate."],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Datadog",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["datadog-domain-verification", "dd-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "New Relic",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["newrelic-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Segment",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["segment-site-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Zendesk",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["zendesk-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Slack",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["slack-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Atlassian",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["atlassian-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Notion",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["notion-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Webflow",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["webflow-domain-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Shopify",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["shopify-verification-code"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Stripe",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["stripe-verification"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Docusign",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["docusign"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Amazon SES",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "txt",
    patterns: ["amazonses:"],
    confidence: ConfidenceLevel.HIGH,
  },

  // --- SPF `include:` mechanisms ---
  {
    vendor: "Google Workspace",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "spfInclude",
    patterns: ["_spf.google.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Microsoft 365",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "spfInclude",
    patterns: ["spf.protection.outlook.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Mailchimp",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["servers.mcsv.net", "mailchimp.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "SendGrid",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["sendgrid.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Mailgun",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["mailgun.org"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "HubSpot",
    category: ProviderCategory.CRM,
    source: "spfInclude",
    patterns: ["hubspot.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Salesforce",
    category: ProviderCategory.CRM,
    source: "spfInclude",
    patterns: ["salesforce.com", "exacttarget.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Klaviyo",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["klaviyo.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Intercom",
    category: ProviderCategory.OTHER_SAAS,
    source: "spfInclude",
    patterns: ["intercom.io"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Amazon SES",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "spfInclude",
    patterns: ["amazonses.com"],
    confidence: ConfidenceLevel.HIGH,
  },
];
