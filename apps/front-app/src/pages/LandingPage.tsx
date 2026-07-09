import { useNavigate } from "@tanstack/react-router";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { type FormEvent, useState } from "react";

/**
 * Entry screen. Not an agent prompt — a single lookup field that navigates to
 * `/runs/$runId` for a Flue run UUID (runs are started out of band). Everything
 * else in the app is driven by the URL.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const [runId, setRunId] = useState("");
  const trimmedRunId = runId.trim();

  function openRun(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (trimmedRunId.length === 0) {
      return;
    }
    void navigate({ to: "/runs/$runId", params: { runId: trimmedRunId } });
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
          Agentic GTM
        </span>
        <h1 className="text-3xl font-semibold text-slate-100">
          Run execution visualizer
        </h1>
        <p className="text-slate-400">
          Watch a Flue workflow run build itself in real time — the
          orchestrator, its sub-agents, and every tool and MCP call appear as
          the run streams over SSE.
        </p>
      </header>

      <Card>
        <form onSubmit={openRun} className="flex flex-col gap-3">
          <label
            htmlFor="run-id"
            className="text-sm font-medium text-slate-300"
          >
            Flue run UUID
          </label>
          <div className="flex gap-2">
            <input
              id="run-id"
              value={runId}
              onChange={(event) => setRunId(event.target.value)}
              placeholder="e.g. 5f3c1e2a-…"
              autoComplete="off"
              spellCheck={false}
              className="h-10 flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus-visible:border-indigo-400/70 focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            />
            <Button type="submit" disabled={trimmedRunId.length === 0}>
              Open run
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-xs/relaxed text-slate-500">
        Start a run out of band, then open its id. Demo workflow:{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">
          {`curl -X POST localhost:8788/workflows/sample-answer -d '{"question":"hi"}'`}
        </code>
      </p>
    </main>
  );
}
