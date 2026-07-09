import { defineAgentProfile } from "@flue/runtime";

import { Model } from "../../enums/model";
import { ThinkingLevel } from "../../enums/thinking-level";
import dnsFingerprint from "../../skills/dns-fingerprint/SKILL.md" with { type: "skill" };
import { analyzeDomain } from "../../tools/analyze-domain";
import instructions from "./techstack-prober.md" with { type: "markdown" };

/**
 * `techstack_prober` — stage 1 specialist. Calls the key-less `analyze_domain`
 * DNS tool and normalizes the result into a tech-stack fingerprint. Small/fast
 * Workers-AI model: it drives one tool call and shapes the output, no heavy
 * reasoning. Built inside the orchestrator's factory (see `orchestrator.ts`).
 */
export function createTechstackProber() {
  return defineAgentProfile({
    name: "techstack_prober",
    description:
      "Infers the technical stack a company runs from its public DNS alone. Given a domain, calls the analyze_domain tool and returns a normalized tech-stack fingerprint (CDN/proxy, DNS, mail, CRM, SSO, marketing) plus whether it runs Cloudflare.",
    model: Model.GEMMA_4_26B_A4B_IT,
    instructions,
    thinkingLevel: ThinkingLevel.LOW,
    tools: [analyzeDomain],
    skills: [dnsFingerprint],
  });
}
