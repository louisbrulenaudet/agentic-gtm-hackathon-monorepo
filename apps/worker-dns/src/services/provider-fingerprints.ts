import { ConfidenceLevel, ProviderCategory } from "@repo/enums-common";

/** Which normalized record set a fingerprint's `patterns` are matched against. */
export type FingerprintSource = "ns" | "mxExchange" | "txt" | "spfInclude";

export interface ProviderFingerprint {
  vendor: string;
  category: ProviderCategory;
  source: FingerprintSource;
  /**
   * For `ns` / `mxExchange` / `spfInclude`: DNS-label-boundary hostname
   * patterns (see `hostMatches` in `provider-detector.ts`). For `txt`: verbatim
   * substrings of a domain-verification TXT value.
   */
  patterns: string[];
  confidence: ConfidenceLevel;
}

/**
 * Data-driven provider fingerprints, verified against vendor documentation. Add
 * a new vendor by appending an entry — no code changes needed elsewhere.
 *
 * Deliberately excluded (do not add without re-verifying first):
 *
 * - Vendors whose only domain-verification signal lives on a dedicated sub-label
 *   (e.g. `_stripe-verification.<domain>`, `_webflow.<domain>`,
 *   `shopify_verification.<domain>`, `_oktaverification.<domain>`,
 *   `_amazonses.<domain>`, `_globalsign-domain-verification.<domain>`,
 *   `_notion-dcv.<domain>`, `wix-verification.<domain>`,
 *   `zendeskverification.<domain>`). This pipeline only queries TXT records at
 *   the apex domain (see `dns-client.ts`), so these are structurally invisible
 *   here — including a fingerprint for them would silently never match.
 *   Detecting them would require querying each specific sub-label.
 * - Vendors with no publicly documented, stable TXT/SPF literal (opaque
 *   vendor-issued tokens with no fixed prefix): Okta, Auth0, OneLogin, Ping
 *   Identity, JumpCloud, Duo Security, 1Password, Klaviyo, ActiveCampaign
 *   (TXT), Datadog, New Relic, Dynatrace, Sentry, Segment, Amplitude,
 *   PagerDuty, Pinterest, PayPal, Braintree, Dropbox, Box.
 * - Bing's TXT verification uses a hash-based mechanism distinct from its
 *   documented meta-tag string (`msvalidate.01=`) — no confirmed TXT literal.
 */
export const PROVIDER_FINGERPRINTS: ProviderFingerprint[] = [
  // ============================================================
  // DNS providers (NS records)
  // ============================================================
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
    // traffic is proxied through it — kept at MEDIUM for that reason. CDN/proxy
    // detection is otherwise out of reach without CNAME/A records, which this
    // pipeline does not query.
    patterns: ["cloudflare.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "AWS Route 53",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    // e.g. ns-1472.awsdns-56.{com,net,org,co.uk} — "awsdns" is unique regardless of TLD.
    patterns: ["awsdns"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Google Cloud DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    // e.g. ns-cloud-a1.googledomains.com.
    patterns: ["googledomains.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Azure DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: [
      "azure-dns.com",
      "azure-dns.net",
      "azure-dns.org",
      "azure-dns.info",
    ],
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
    // Shared registrar infra — a strong signal the domain is registered with
    // Namecheap, but not exclusively theirs at the infra level.
    patterns: ["registrar-servers.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "DigitalOcean",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["digitalocean.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "NS1 (IBM)",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    // Also the white-labeled backend for Netlify DNS and some Squarespace
    // Domains zones — a match confirms "NS1 infrastructure", not necessarily
    // that the registrant is an NS1 customer directly.
    patterns: ["nsone.net"],
    confidence: ConfidenceLevel.MEDIUM,
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
  {
    vendor: "DNSimple",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["dnsimple-edge.com", "dnsimple.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Oracle Dyn",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["dynect.net"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Oracle Cloud DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["dns.oraclecloud.net"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Neustar UltraDNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    // e.g. pdns1.ultradns.{net,org,info,co.uk} — no single stable TLD.
    patterns: ["ultradns"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Hurricane Electric",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["he.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "OVHcloud",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["ovh.net", "anycast.me"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Gandi",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["gandi.net"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "ClouDNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["cloudns.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "DNS Made Easy",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["dnsmadeeasy.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Constellix",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["constellix.com", "constellix.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "easyDNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["easydns.com", "easydns.net", "easydns.org", "easydns.info"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Rackspace DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["rackspace.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Squarespace Domains",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    // Squarespace runs on mixed backends post Google-Domains acquisition — a
    // miss here doesn't rule Squarespace out (it may show as NS1/Cloudflare).
    patterns: ["squarespacedns.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Hetzner DNS",
    category: ProviderCategory.DNS_PROVIDER,
    source: "ns",
    patterns: ["hetzner.com", "first-ns.de", "second-ns.de", "second-ns.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },

  // ============================================================
  // Email providers (MX records)
  // ============================================================
  {
    vendor: "Google Workspace",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    // smtp.google.com is the current (2023+) target; aspmx.l.google.com is
    // the legacy one still seen on older tenants.
    patterns: ["smtp.google.com", "aspmx.l.google.com", "googlemail.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Microsoft 365",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    // mail.protection.outlook.com is standard; mx.microsoft is the
    // newer suffix Microsoft is migrating tenants to since mid-2025.
    patterns: ["mail.protection.outlook.com", "mx.microsoft"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Zoho Mail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["zoho.com", "zoho.eu", "zoho.in"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "ProtonMail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["protonmail.ch"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Fastmail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["messagingengine.com"],
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
    // pphosted.com = Enterprise; ppe-hosted.com = Essentials/SMB.
    patterns: ["pphosted.com", "ppe-hosted.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Barracuda Email Security",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["barracudanetworks.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Cisco Secure Email (IronPort)",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["iphmx.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Amazon SES",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    // e.g. inbound-smtp.us-west-2.amazonaws.com — the region varies, the
    // "inbound-smtp" label does not.
    patterns: ["inbound-smtp"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Rackspace Email",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["emailsrvr.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "IONOS / 1&1 Mail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["ionos.com", "1and1.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "OVHcloud Mail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["mail.ovh.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "iCloud Mail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["mail.icloud.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Yahoo Small Business Mail",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["yahoodns.net", "biz.mail.yahoo.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "GMX",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["gmx.net"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Runbox",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["runbox.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Titan Email",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "mxExchange",
    patterns: ["titan.email"],
    confidence: ConfidenceLevel.HIGH,
  },

  // ============================================================
  // TXT domain-verification tokens (value substrings)
  // ============================================================
  {
    vendor: "HubSpot",
    category: ProviderCategory.CRM,
    source: "txt",
    // App-connect flow; standalone email-domain connect has no ownership token.
    patterns: ["hubspot-developer-verification="],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Zoho CRM",
    category: ProviderCategory.CRM,
    source: "txt",
    patterns: ["zmverify.zoho.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Microsoft 365 / Entra ID",
    category: ProviderCategory.SSO_IDP,
    source: "txt",
    // Generic Microsoft cloud tenant/domain-ownership token — shared across
    // Microsoft 365, Entra ID (Azure AD), Teams, and other Microsoft services;
    // it does not distinguish which one specifically.
    patterns: ["MS=ms"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Adobe Identity Management",
    category: ProviderCategory.SSO_IDP,
    source: "txt",
    patterns: ["adobe-idp-site-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Google (Search Console / Workspace)",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    // Shared token format across many Google products; does not distinguish
    // Search Console from Workspace domain verification.
    patterns: ["google-site-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Yandex Webmaster",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["yandex-verification"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Ahrefs",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["ahrefs-site-verification_"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Mixpanel",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["mixpanel-domain-verify="],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Atlassian StatusPage",
    category: ProviderCategory.ANALYTICS,
    source: "txt",
    patterns: ["status-page-domain-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Atlassian",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    // Covers org-level Jira/Confluence/Trello domain verification.
    patterns: ["atlassian-domain-verification="],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Miro",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["miro-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Slack",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["slack-domain-verification="],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "DocuSign",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["docusign="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Adobe Acrobat Sign",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["adobe-sign-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Twilio",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["twilio-domain-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Apple Business/School Manager",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["apple-domain-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Meta (Facebook Business)",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["facebook-domain-verification="],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Cisco Webex",
    category: ProviderCategory.OTHER_SAAS,
    source: "txt",
    patterns: ["cisco-ci-domain-verification"],
    confidence: ConfidenceLevel.MEDIUM,
  },

  // ============================================================
  // SPF `include:` mechanisms
  // ============================================================
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
    vendor: "Amazon SES",
    category: ProviderCategory.EMAIL_PROVIDER,
    source: "spfInclude",
    patterns: ["amazonses.com"],
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
    vendor: "Postmark",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["spf.mtasv.net"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Mailchimp",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    // Legacy mechanism; current Mailchimp sending doesn't require an SPF
    // include, but older domains still carry it.
    patterns: ["servers.mcsv.net"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Brevo",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["spf.brevo.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Campaign Monitor",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["_spf.createsend.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Customer.io",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["customeriomail.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Marketo",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["mktomail.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "GetResponse",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["_spf.getresponse.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "AWeber",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["_spf.aweber.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Constant Contact",
    category: ProviderCategory.MARKETING_AUTOMATION,
    source: "spfInclude",
    patterns: ["spf.constantcontact.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
  {
    vendor: "Salesforce",
    category: ProviderCategory.CRM,
    source: "spfInclude",
    // Shared by core Salesforce, Pardot/Account Engagement, and Marketing
    // Cloud/ExactTarget — does not distinguish which Salesforce product.
    patterns: ["_spf.salesforce.com"],
    confidence: ConfidenceLevel.HIGH,
  },
  {
    vendor: "Zoho",
    category: ProviderCategory.CRM,
    source: "spfInclude",
    patterns: ["zohomail.com"],
    confidence: ConfidenceLevel.MEDIUM,
  },
];
