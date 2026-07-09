import * as v from "valibot";

/**
 * Mirrors FullEnrich's own contact-matching rule (see
 * https://docs.fullenrich.com): a contact is identifiable either by a LinkedIn
 * URL, or by name plus a company (domain or name).
 */
export const ContactQuerySchema = v.pipe(
  v.object({
    firstName: v.pipe(
      v.string(),
      v.minLength(1, "First name is required."),
      v.description("The contact's first name."),
    ),
    lastName: v.pipe(
      v.string(),
      v.minLength(1, "Last name is required."),
      v.description("The contact's last name."),
    ),
    companyDomain: v.pipe(
      v.optional(v.pipe(v.string(), v.minLength(1))),
      v.description("The contact's company domain, e.g. acme.com."),
    ),
    companyName: v.pipe(
      v.optional(v.pipe(v.string(), v.minLength(1))),
      v.description(
        "The contact's company name, used if the domain is unknown.",
      ),
    ),
    linkedinUrl: v.pipe(
      v.optional(v.pipe(v.string(), v.url("linkedinUrl must be a valid URL."))),
      v.description("The contact's LinkedIn profile URL, if known."),
    ),
  }),
  v.check(
    (contact) =>
      contact.linkedinUrl !== undefined ||
      contact.companyDomain !== undefined ||
      contact.companyName !== undefined,
    "Provide a linkedinUrl, or a companyDomain/companyName alongside the name.",
  ),
);

export const EmailStatusSchema = v.picklist([
  "DELIVERABLE",
  "HIGH_PROBABILITY",
  "CATCH_ALL",
  "INVALID",
]);

export const EnrichedContactSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  email: v.nullable(v.string()),
  emailStatus: v.nullable(EmailStatusSchema),
  phone: v.nullable(v.string()),
  found: v.pipe(
    v.boolean(),
    v.description(
      "Whether FullEnrich returned a usable match for this contact.",
    ),
  ),
  // Kept in the same shape (rather than a thrown error or a free-text
  // return) so the tool's `output` schema always validates, even when
  // FullEnrich is unreachable/unconfigured or found nothing — the caller
  // gets one uniform, strictly-typed contract in every case.
  error: v.pipe(
    v.nullable(v.string()),
    v.description(
      "Set when enrichment could not be attempted or failed; null on an ordinary lookup (found or not found).",
    ),
  ),
});

export const EnrichContactsInputSchema = v.object({
  contacts: v.pipe(
    v.array(ContactQuerySchema),
    v.minLength(1, "Provide at least one contact."),
    v.maxLength(100, "FullEnrich accepts at most 100 contacts per batch."),
  ),
});

export const EnrichContactsOutputSchema = v.object({
  contacts: v.array(EnrichedContactSchema),
});

export type ContactQuery = v.InferOutput<typeof ContactQuerySchema>;
export type EmailStatus = v.InferOutput<typeof EmailStatusSchema>;
export type EnrichedContact = v.InferOutput<typeof EnrichedContactSchema>;
export type EnrichContactsInput = v.InferOutput<
  typeof EnrichContactsInputSchema
>;
export type EnrichContactsOutput = v.InferOutput<
  typeof EnrichContactsOutputSchema
>;
