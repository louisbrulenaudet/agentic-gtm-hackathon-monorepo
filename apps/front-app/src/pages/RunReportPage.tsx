import type { ReactNode } from "react";
import { RunStreamPhase } from "@enums/run-stream-phase";
import { useFlueRunStream } from "@hooks/use-flue-run-stream";
import { runQueryOptions } from "@services/flue/run-query-options";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type {
  ProspectReport,
  ReportBadge,
  ReportContact,
  ReportPainPoint,
} from "@/dtos/prospect-report";
import { parseProspectReport } from "@/lib/report/report-result";

const badgeClassNames: Record<ReportBadge["tone"], string> = {
  amber: "border-amber-500/35 bg-amber-500/15 text-amber-200",
  blue: "border-sky-500/35 bg-sky-500/15 text-sky-200",
  green: "border-emerald-500/35 bg-emerald-500/15 text-emerald-200",
  purple: "border-purple-500/35 bg-purple-500/15 text-purple-200",
  red: "border-red-500/35 bg-red-500/15 text-red-200",
  slate: "border-slate-500/35 bg-slate-500/15 text-slate-200",
};

export type RunReportPageProps = Readonly<{ runId: string }>;

export function RunReportPage({ runId }: RunReportPageProps) {
  const { data: run } = useSuspenseQuery(runQueryOptions(runId));
  const stream = useFlueRunStream(runId);
  const report = parseProspectReport(stream.result);

  if (!report) {
    return (
      <ReportPending
        runId={runId}
        workflowName={run.workflowName}
        phase={stream.phase}
        error={stream.error}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-[#090909] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-9 px-5 py-8 sm:px-8 xl:px-12">
        <ReportHeader
          report={report}
          runId={runId}
          workflowName={run.workflowName}
        />
        <CompanyIntelligence report={report} />
        <TechnicalStack report={report} />
        <PitchAndContacts report={report} />
        <DebugPanel report={report} />
      </div>
    </main>
  );
}

function ReportPending({
  runId,
  workflowName,
  phase,
  error,
}: {
  runId: string;
  workflowName: string;
  phase: RunStreamPhase;
  error?: string;
}) {
  const phaseText =
    phase === RunStreamPhase.COMPLETED
      ? "Report result not found"
      : "Building report";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
          {workflowName}
        </p>
        <h1 className="mt-4 text-3xl font-black text-white">{phaseText}</h1>
        <p className="mt-3 text-slate-400">
          The report page is waiting for a completed run result shaped as a
          prospect report.
        </p>
        <code className="mt-6 block rounded-xl bg-black/45 p-4 text-sm text-slate-300">
          {runId}
        </code>
        {error ? (
          <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-red-200">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/runs/$runId"
            params={{ runId }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            View run graph
          </Link>
          <Link
            to="/"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15"
          >
            New lookup
          </Link>
        </div>
      </section>
    </main>
  );
}

function ReportHeader({
  report,
  runId,
  workflowName,
}: {
  report: ProspectReport;
  runId: string;
  workflowName: string;
}) {
  return (
    <header className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-center gap-5">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-3xl border border-orange-400/30 bg-orange-500/10 text-4xl font-black text-orange-200 shadow-[0_0_70px_rgba(249,115,22,0.18)]">
          GT
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-sm uppercase tracking-[0.35em] text-slate-500">
            Discovery Results
          </p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
            {report.company.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-lg text-slate-300">
            <span>
              Analysis for{" "}
              <code className="text-orange-300">{report.company.domain}</code>
            </span>
            {report.company.pop ? (
              <span className="text-amber-300">POP: {report.company.pop}</span>
            ) : null}
          </div>
          <p className="mt-2 truncate font-mono text-xs text-slate-600">
            {workflowName} / {runId}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 lg:justify-end">
        <Link
          to="/runs/$runId"
          params={{ runId }}
          className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/15"
        >
          Run graph
        </Link>
        <Link
          to="/"
          className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-950/40 hover:bg-orange-400"
        >
          New scan
        </Link>
      </div>
    </header>
  );
}

function CompanyIntelligence({ report }: { report: ProspectReport }) {
  return (
    <section className="rounded-[28px] border border-orange-500/35 bg-[#1a1718] p-6 shadow-2xl shadow-black/30 sm:p-9">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <SectionIcon label="AI" />
          <h2 className="text-3xl font-black text-white">
            Company Intelligence
          </h2>
          {report.company.badges.map((badge) => (
            <Badge key={badge.label} badge={badge} />
          ))}
        </div>
        <Score
          label={report.company.fitLabel}
          score={report.company.fitScore}
        />
      </div>

      <BlockTitle>Executive Summary</BlockTitle>
      <p className="max-w-6xl text-xl/9 text-slate-200">
        {report.company.summary}
      </p>

      <BlockTitle>Technical Drivers</BlockTitle>
      <div className="flex flex-wrap gap-3">
        {report.company.technicalDrivers.map((driver) => (
          <span
            key={driver}
            className="rounded-full border border-orange-500/45 px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-amber-300"
          >
            {driver}
          </span>
        ))}
      </div>

      <BlockTitle>Identified Pain Points</BlockTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {report.company.painPoints.map((painPoint) => (
          <PainPointCard key={painPoint.id} painPoint={painPoint} />
        ))}
      </div>
    </section>
  );
}

function TechnicalStack({ report }: { report: ProspectReport }) {
  return (
    <section className="grid gap-8">
      <ReportCard>
        <SectionTitle label="SH" title="CDN & WAF" />
        <div className="mt-7 grid gap-3">
          {report.hostnames.map((finding) => (
            <div
              key={finding.hostname}
              className="grid gap-3 rounded-xl bg-black/55 px-4 py-3 font-mono text-lg text-slate-200 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <span>{finding.hostname}</span>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Tag tone={finding.cdn ? "green" : "slate"}>
                  {finding.cdn ?? "No CDN"}
                </Tag>
                {finding.gateway ? (
                  <Tag tone="blue">{finding.gateway}</Tag>
                ) : null}
                {finding.httpStatus ? (
                  <Tag tone="amber">{finding.httpStatus}</Tag>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {finding.warnings.map((warning) => (
                  <Tag key={warning} tone="red">
                    {warning}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ReportCard>

      <div className="grid gap-8 lg:grid-cols-2">
        <ReportCard>
          <SectionTitle label="GL" title="Domain" />
          <InfoRow
            label="DNS Provider"
            value={report.stack.domain.dnsProvider}
            highlight
          />
          <InfoRow label="Registrar" value={report.stack.domain.registrar} />
          <InfoRow label="Created" value={report.stack.domain.createdAt} />
        </ReportCard>
        <ReportCard>
          <SectionTitle label="EM" title="Email Stack" />
          <InfoRow
            label="Provider"
            value={report.stack.email.provider}
            highlight
          />
          <TagGroup
            label="Marketing Tools"
            values={report.stack.email.marketingTools}
            tone="blue"
          />
          <TagGroup
            label="Anti-Phishing"
            values={report.stack.email.antiPhishing}
            tone="purple"
          />
        </ReportCard>
        {report.stack.technologies.map((technology) => (
          <ReportCard key={technology.id}>
            <SectionTitle label="TK" title={technology.title} />
            <div className="mt-7 flex flex-wrap items-center gap-3 text-xl text-slate-300">
              <span>
                {technology.primaryText ??
                  `No ${technology.title.toLowerCase()} detected`}
              </span>
              {technology.tags.map((tag) => (
                <Badge key={tag.label} badge={tag} />
              ))}
            </div>
          </ReportCard>
        ))}
      </div>

      <ReportCard>
        <SectionTitle label="SR" title="Detected Tools & Services" />
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {report.stack.serviceGroups.map((group) => (
            <div key={group.label}>
              <BlockTitle compact>{group.label}</BlockTitle>
              <div className="flex flex-wrap gap-3">
                {group.services.map((service) => (
                  <Tag key={service} tone="amber">
                    {service}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ReportCard>
    </section>
  );
}

function PitchAndContacts({ report }: { report: ProspectReport }) {
  return (
    <section className="grid gap-8 xl:grid-cols-[1fr_1.15fr]">
      <ReportCard>
        <SectionTitle label="PT" title="Technical Pitch" />
        <h3 className="mt-7 text-2xl font-bold text-amber-200">
          {report.pitch.title}
        </h3>
        <BlockTitle>Technical Angle</BlockTitle>
        <p className="text-lg/8 text-slate-200">
          {report.pitch.technicalAngle}
        </p>
        <BlockTitle>Business Angle</BlockTitle>
        <p className="text-lg/8 text-slate-200">{report.pitch.businessAngle}</p>
        <BlockTitle>Discovery Questions</BlockTitle>
        <ul className="grid gap-3 text-lg text-slate-200">
          {report.pitch.discoveryQuestions.map((question) => (
            <li key={question} className="rounded-xl bg-black/35 p-4">
              {question}
            </li>
          ))}
        </ul>
      </ReportCard>
      <ReportCard>
        <SectionTitle label="CO" title="Accounts & Contacts" />
        <div className="mt-7 grid gap-4">
          {report.contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </ReportCard>
    </section>
  );
}

function DebugPanel({ report }: { report: ProspectReport }) {
  return (
    <details className="rounded-[28px] border border-white/10 bg-[#171717] p-6 text-slate-300 sm:p-9">
      <summary className="cursor-pointer text-2xl font-bold text-slate-300">
        Debug for SE
      </summary>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <DebugBlock
          title="CDN by Hostname (Raw)"
          lines={report.debug.cdnByHostnameRaw}
        />
        <DebugBlock
          title={`HTTP Headers (${report.debug.httpHeaders.length})`}
          lines={report.debug.httpHeaders.map(
            (header) => `${header.name}: ${header.value}`,
          )}
        />
        <DebugBlock
          title={`MX Records (${report.debug.mxRecords.length})`}
          lines={report.debug.mxRecords.map(
            (record) => `${record.priority} ${record.exchange}`,
          )}
        />
        <DebugBlock
          title={`NS Records (${report.debug.nsRecords.length})`}
          lines={report.debug.nsRecords}
        />
      </div>
    </details>
  );
}

function ReportCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#191919] p-6 shadow-2xl shadow-black/25 sm:p-9">
      {children}
    </div>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <SectionIcon label={label} />
      <h2 className="text-3xl font-black text-white">{title}</h2>
    </div>
  );
}

function SectionIcon({ label }: { label: string }) {
  return (
    <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm font-black text-orange-300 ring-1 ring-orange-500/10">
      {label}
    </span>
  );
}

function Score({ label, score }: { label: string; score: number }) {
  return (
    <div className="min-w-44 text-right">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="flex items-center justify-end gap-4">
        <div className="h-3 w-36 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-300"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-2xl font-black text-amber-300">{score}</span>
      </div>
    </div>
  );
}

function PainPointCard({ painPoint }: { painPoint: ReportPainPoint }) {
  return (
    <article className="flex gap-4 rounded-xl bg-black/55 p-5 text-lg/7 text-slate-200">
      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300 ring-1 ring-red-400/35">
        !
      </span>
      <p>{painPoint.text}</p>
    </article>
  );
}

function ContactCard({ contact }: { contact: ReportContact }) {
  return (
    <article className="rounded-2xl bg-black/35 p-5 ring-1 ring-white/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            {contact.firstName} {contact.lastName}
          </h3>
          <p className="mt-1 text-slate-400">
            {contact.title ?? "Title unknown"}
          </p>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">
            {contact.company ?? "Company unknown"}
          </p>
        </div>
        {contact.linkedinUrl ? (
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-sky-300 hover:text-sky-200"
          >
            LinkedIn
          </a>
        ) : null}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ContactValue
          label="Email"
          value={contact.email}
          meta={contact.emailStatus}
        />
        <ContactValue label="Phone" value={contact.phone} />
      </div>
    </article>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="mt-7">
      <BlockTitle compact>{label}</BlockTitle>
      <p
        className={
          highlight
            ? "text-2xl font-bold text-emerald-300"
            : "text-2xl text-slate-100"
        }
      >
        {value ?? "Unknown"}
      </p>
    </div>
  );
}

function TagGroup({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: ReportBadge["tone"];
}) {
  return (
    <div className="mt-7">
      <BlockTitle compact>{label}</BlockTitle>
      <div className="flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <Tag key={value} tone={tone}>
              {value}
            </Tag>
          ))
        ) : (
          <span className="text-slate-500">None detected</span>
        )}
      </div>
    </div>
  );
}

function ContactValue({
  label,
  value,
  meta,
}: {
  label: string;
  value?: string | null;
  meta?: string | null;
}) {
  return (
    <div className="rounded-xl bg-white/4 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-all font-mono text-lg text-slate-100">
        {value ?? "Not found"}
      </p>
      {meta ? (
        <p className="mt-1 text-xs font-semibold text-emerald-300">{meta}</p>
      ) : null}
    </div>
  );
}

function Badge({ badge }: { badge: ReportBadge }) {
  return (
    <span
      className={`rounded-lg border px-3 py-1 text-sm font-semibold ${badgeClassNames[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: ReportBadge["tone"];
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-md border px-3 py-1 text-sm font-semibold ${badgeClassNames[tone]}`}
    >
      {children}
    </span>
  );
}

function BlockTitle({
  compact = false,
  children,
}: {
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <h3
      className={`${compact ? "mb-3 mt-0" : "mb-5 mt-10"} text-sm font-black uppercase tracking-[0.22em] text-slate-500`}
    >
      {children}
    </h3>
  );
}

function DebugBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section>
      <h3 className="mb-4 text-xl font-medium text-slate-400">{title}</h3>
      <pre className="max-h-80 overflow-auto rounded-xl bg-black/65 p-5 text-sm/7 text-slate-200">
        {lines.join("\n")}
      </pre>
    </section>
  );
}
