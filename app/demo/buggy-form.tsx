"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function BuggyForm() {
  const [name, setName] = useState("");
  const [issue, setIssue] = useState("");
  const [steps, setSteps] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("Draft");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Sending");

    setTimeout(() => {
      // BUG: should setSubmitted(true) and status to Sent.
      setSubmitted(true);
      setStatus("Sent");
    }, 350);
  };

  return (
    <div className="w-full space-y-6 rounded-[28px] border-2 border-ink/10 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-balance text-xl font-semibold leading-tight text-ink sm:text-2xl md:text-3xl">
            Replay Incident Report
          </h2>
          <p className="text-balance text-sm text-muted sm:text-base">File a quick report to reproduce the bug.</p>
        </div>
        <Badge data-testid="status-chip" variant={submitted ? "success" : "default"}>
          {submitted ? "✅ Sent" : status}
        </Badge>
      </div>

      {submitted ? (
        <div
          data-testid="success-banner"
          className="rounded-2xl border-2 border-success/40 bg-hero-lime px-4 py-3 text-sm font-semibold text-ink"
        >
          Report sent to the Replay pipeline.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted">Reporter</label>
            <Input
              data-testid="name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ava Pilot"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Issue ID</label>
            <Input
              data-testid="issue-input"
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder="RPL-102"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Steps Captured</label>
          <Textarea
            data-testid="steps-input"
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            placeholder="Click submit, no success banner..."
          />
        </div>

        <Button type="submit" data-testid="submit-button" className="w-full whitespace-nowrap wiggle-hover">
          Send Replay Report
        </Button>
      </form>
    </div>
  );
}
