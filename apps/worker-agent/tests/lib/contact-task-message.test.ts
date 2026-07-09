import { describe, expect, it } from "vitest";

import { buildContactTaskMessage } from "../../src/lib/contact-task-message";

describe("buildContactTaskMessage", () => {
  it("embeds the exact contact fields as JSON", () => {
    const message = buildContactTaskMessage({
      firstName: "Ada",
      lastName: "Lovelace",
      companyDomain: "acme.com",
    });

    expect(message).toContain('"firstName":"Ada"');
    expect(message).toContain('"lastName":"Lovelace"');
    expect(message).toContain('"companyDomain":"acme.com"');
    expect(message).toMatch(/never inventing/i);
  });
});
